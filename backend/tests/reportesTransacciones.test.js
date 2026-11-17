import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Reporte from "../models/Reporte.js";
import Usuario from "../models/Usuario.js";
import { resolverReporte, saldarReporte } from "../controllers/reporteController.js";

// Usar exclusivamente una instancia de pruebas con replica set. Cada ejecución
// crea y elimina su propia base; nunca utiliza MONGO_URI de la aplicación.
// Desde backend: MONGO_TEST_URI="mongodb://127.0.0.1:27019/?replicaSet=favorcitoTest" node --test tests/*.test.js
const uri = process.env.MONGO_TEST_URI;
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("reportes: atomicidad y concurrencia con MongoDB real", { skip: !uri }, async (t) => {
  await mongoose.connect(uri, { dbName: `favorcito_test_${new mongoose.Types.ObjectId()}` });
  t.after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all([Reporte.init(), Usuario.init()]);
  const cliente = new mongoose.Types.ObjectId();
  const reportante = new mongoose.Types.ObjectId();
  const admin = new mongoose.Types.ObjectId();
  const crear = async (extra = {}) => Reporte.create({
    reportante, estudianteReportado: cliente, tipoReportado: "estudiante", motivo: "no_pago", ...extra,
  });
  const llamar = async (handler, id, decision = "procedente") => {
    const res = response();
    await handler({ params: { id: String(id) }, body: { decision }, usuario: { _id: admin } }, res);
    return res;
  };
  const usuario = () => Usuario.findById(cliente).lean();
  const reset = async (faltas = 0) => {
    await Reporte.deleteMany({});
    await Usuario.deleteMany({});
    await Usuario.collection.insertMany([
      { _id: cliente, email: "cliente@example.test", matricula: "cliente", faltas, activo: true, bloqueoPorPago: false },
      { _id: reportante, email: "reportante@example.test", matricula: "reportante", reportesImprocedentes: 2, sospechoso: false },
    ]);
  };

  for (const fallo of ["incremento", "sancion", "bloqueo"]) {
    await t.test(`revierte reporte y usuario si falla ${fallo}`, async (t) => {
      await reset();
      const reporte = await crear();
      const metodo = fallo === "incremento" ? "findByIdAndUpdate" : "updateOne";
      const original = Usuario[metodo];
      t.mock.method(Usuario, metodo, function (...args) {
        const update = args[1];
        if (fallo !== "bloqueo" || update.$set?.bloqueoPorPago) throw new Error("detalle interno");
        return original.apply(this, args);
      });
      const res = await llamar(resolverReporte, reporte._id);
      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body, { mensaje: "Error al resolver reporte" });
      assert.equal((await Reporte.findById(reporte._id)).estado, "pendiente");
      assert.equal((await usuario()).faltas, 0);
      assert.equal((await usuario()).bloqueoPorPago, false);
      assert.equal((await usuario()).avisoFalta, undefined);
    });
  }

  await t.test("dos administradores resuelven una sola vez", async () => {
    await reset(2);
    const reporte = await crear();
    const resultados = await Promise.all([
      llamar(resolverReporte, reporte._id), llamar(resolverReporte, reporte._id),
    ]);
    assert.deepEqual(resultados.map((r) => r.statusCode).sort(), [200, 409]);
    const u = await usuario();
    assert.equal(u.faltas, 3);
    assert.equal(u.activo, false);
    assert.equal(u.bloqueoPorPago, true);
    assert.ok(u.suspendidoHasta > new Date(Date.now() + 6.9 * 864e5));
  });

  await t.test("improcedente revierte contador y resolución si falla la marca", async (t) => {
    await reset();
    const reporte = await crear();
    t.mock.method(Usuario, "updateOne", () => { throw new Error("interno"); });
    assert.equal((await llamar(resolverReporte, reporte._id, "improcedente")).statusCode, 500);
    assert.equal((await Reporte.findById(reporte._id)).estado, "pendiente");
    assert.equal((await Usuario.findById(reportante)).reportesImprocedentes, 2);
  });

  await t.test("conserva bloqueo hasta saldar el último adeudo y no elimina faltas", async () => {
    await reset();
    const a = await crear();
    const b = await crear();
    assert.equal((await llamar(resolverReporte, a._id)).statusCode, 200);
    assert.equal((await llamar(resolverReporte, b._id)).statusCode, 200);
    assert.equal((await llamar(saldarReporte, a._id)).body.bloqueoLevantado, false);
    assert.equal((await usuario()).bloqueoPorPago, true);
    assert.equal((await llamar(saldarReporte, b._id)).body.bloqueoLevantado, true);
    assert.equal((await usuario()).bloqueoPorPago, false);
    assert.equal((await usuario()).faltas, 2);
    assert.equal((await llamar(saldarReporte, b._id)).statusCode, 409);
  });

  await t.test("saldar revierte el adeudo si falla la actualización del bloqueo", async (t) => {
    await reset();
    const reporte = await crear();
    await llamar(resolverReporte, reporte._id);
    t.mock.method(Usuario, "findByIdAndUpdate", () => { throw new Error("interno"); });
    assert.equal((await llamar(saldarReporte, reporte._id)).statusCode, 500);
    assert.equal((await Reporte.findById(reporte._id)).saldado, false);
    assert.equal((await usuario()).bloqueoPorPago, true);
  });

  await t.test("dos saldos simultáneos levantan el bloqueo final", async () => {
    await reset();
    const a = await crear();
    const b = await crear();
    await llamar(resolverReporte, a._id);
    await llamar(resolverReporte, b._id);
    const resultados = await Promise.all([llamar(saldarReporte, a._id), llamar(saldarReporte, b._id)]);
    assert.ok(resultados.every((r) => r.statusCode === 200));
    assert.equal(await Reporte.countDocuments({ saldado: false, estado: "procedente" }), 0);
    assert.equal((await usuario()).bloqueoPorPago, false);
  });

  await t.test("saldar y confirmar un nuevo adeudo simultáneamente conserva bloqueo", async () => {
    await reset();
    const a = await crear();
    const b = await crear();
    await llamar(resolverReporte, a._id);
    const resultados = await Promise.all([llamar(saldarReporte, a._id), llamar(resolverReporte, b._id)]);
    assert.ok(resultados.every((r) => r.statusCode === 200));
    assert.equal((await Reporte.findById(a._id)).saldado, true);
    assert.equal((await Reporte.findById(b._id)).estado, "procedente");
    assert.equal((await usuario()).bloqueoPorPago, true);
  });

  await t.test("un usuario eliminado no deja un reporte procedente sin sanción", async () => {
    await reset();
    const reporte = await crear();
    await Usuario.deleteOne({ _id: cliente });
    assert.equal((await llamar(resolverReporte, reporte._id)).statusCode, 500);
    assert.equal((await Reporte.findById(reporte._id)).estado, "pendiente");
  });
});
