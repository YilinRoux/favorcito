import { solicitarDevolucion, recibirDevolucion, obtenerDevoluciones } from "../controllers/devolucionController.js";
import { evaluarReportePedido } from "../services/sanciones.js";
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";
import Producto from "../models/Producto.js";
import Local from "../models/Local.js";
import Usuario from "../models/Usuario.js";
import { cancelarPedido, cancelarPedidoVendedor, confirmarEntrega } from "../controllers/pedidoController.js";
import { resolverReposicion, obtenerReposicionesPendientes } from "../controllers/reposicionController.js";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
// Solo una instancia de pruebas con replica set; cada ejecución elimina su propia base.
// Desde backend: MONGO_TEST_URI='mongodb://127.0.0.1:27019/?replicaSet=favorcitoTest' node --test tests/*.test.js

test("inventario de cancelaciones: autorización, atomicidad e idempotencia", { skip: !process.env.MONGO_TEST_URI }, async (t) => {
  await mongoose.connect(process.env.MONGO_TEST_URI, { dbName: `restock_test_${new mongoose.Types.ObjectId()}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Pedido.init(), Producto.init(), Local.init(), Usuario.init()]);
  const [vendedor, ajeno, estudiante, localId, productoA, productoB] = Array.from({ length: 6 }, () => new mongoose.Types.ObjectId());
  const request = (id, usuario = vendedor, body = {}) => ({ params: { pedidoId: String(id) }, usuario: { id: String(usuario), _id: usuario }, body, app: { get: () => ({ to: () => ({ emit() {} }) }) } });
  const llamar = async (fn, id, usuario, body) => { const res = response(); await fn(request(id, usuario, body), res); return res; };
  const reset = async (estado = "cancelado") => {
    await Promise.all([Pedido.deleteMany({}), Producto.deleteMany({}), Local.deleteMany({}), Usuario.deleteMany({})]);
    await Local.collection.insertOne({ _id: localId, vendedor });
    await Usuario.collection.insertOne({ _id: estudiante, email: "estudiante@example.test", cancelaciones: 0 });
    await Producto.collection.insertMany([{ _id: productoA, local: localId, stock: 10, activo: false }, { _id: productoB, local: localId, stock: 5, activo: true }]);
    return Pedido.create({ estudiante, local: localId, tipoEntrega: "recoger", total: 100, estado, reposicionStock: { estado: "pendiente" }, createdAt: new Date(Date.now() - 30 * 864e5), productos: [{ producto: productoA, nombre: "Tacos", precio: 20, cantidad: 3 }, { producto: productoB, nombre: "Agua", precio: 20, cantidad: 2 }] });
  };
  const stock = async () => (await Producto.findById(productoA)).stock;
  const resolver = (p, cantidades, autor = vendedor) => llamar(resolverReposicion, p._id, autor, { cantidades });
  for (const [autor, fn] of [["estudiante", cancelarPedido], ["vendedor", cancelarPedidoVendedor]]) {
    await t.test(`cancelar por ${autor} deja revisión pendiente sin devolver stock`, async () => {
      const p = await reset("enviado");
      await Pedido.updateOne({ _id: p._id }, { $unset: { reposicionStock: 1 } });
      assert.equal((await llamar(fn, p._id, autor === "estudiante" ? estudiante : vendedor)).statusCode, 200);
      assert.equal(await stock(), 10);
      const actualizado = await Pedido.findById(p._id);
      assert.equal(actualizado.reposicionStock.estado, "pendiente"); assert.equal(actualizado.canceladoPor, autor); assert.equal(actualizado.estado, "cancelado");
      assert.equal((await Usuario.findById(estudiante)).cancelaciones, autor === "estudiante" ? 1 : 0);
    });
  }
  await t.test("si falla la penalización se revierte también la cancelación", async (t) => {
    const p = await reset("enviado");
    await Pedido.updateOne({ _id: p._id }, { $unset: { reposicionStock: 1 } });
    t.mock.method(Usuario, "findByIdAndUpdate", () => { throw new Error("interno"); });
    assert.equal((await llamar(cancelarPedido, p._id, estudiante)).statusCode, 500);
    const actual = await Pedido.findById(p._id);
    assert.equal(actual.estado, "enviado"); assert.equal(actual.reposicionStock, undefined); assert.equal(await stock(), 10);
  });
  await t.test("reposición parcial auditada no reactiva productos ni duplica stock", async () => {
    const p = await reset(); assert.equal((await resolver(p, [1, 0])).statusCode, 200); assert.equal(await stock(), 11);
    assert.equal((await Producto.findById(productoA)).activo, false);
    const d = (await Pedido.findById(p._id)).reposicionStock;
    assert.equal(d.estado, "resuelta"); assert.deepEqual([...d.cantidades], [1, 0]); assert.equal(String(d.revisadoPor), String(vendedor)); assert.ok(d.revisadoEn instanceof Date);
    assert.equal((await resolver(p, [1, 0])).statusCode, 409); assert.equal(await stock(), 11);
  });
  await t.test("otro vendedor no puede consultar ni resolver cancelaciones ajenas", async () => {
    const p = await reset(); assert.equal((await resolver(p, [3, 2], ajeno)).statusCode, 404);
    const res = response(); await obtenerReposicionesPendientes(request(p._id, ajeno), res); assert.deepEqual(res.body, []); assert.equal(await stock(), 10);
  });
  await t.test("rechaza cantidades negativas, decimales, texto, excesivas y listas incompletas", async () => {
    const p = await reset();
    for (const valores of [[-1, 0], [0.5, 0], ["1", 0], [4, 0], [1], [], [1, 0, 0], [Number.MAX_SAFE_INTEGER + 1, 0]]) assert.equal((await resolver(p, valores)).statusCode, 400);
    assert.equal(await stock(), 10); assert.equal((await Pedido.findById(p._id)).reposicionStock.estado, "pendiente");
  });
  await t.test("permite decidir no reponer ninguna unidad", async () => {
    const p = await reset(); assert.equal((await resolver(p, [0, 0])).statusCode, 200); assert.equal(await stock(), 10); assert.equal((await Pedido.findById(p._id)).reposicionStock.estado, "resuelta");
  });
  await t.test("decisiones simultáneas incrementan stock una sola vez", async () => {
    const p = await reset(); const resultados = await Promise.all([resolver(p, [3, 2]), resolver(p, [3, 2])]);
    assert.deepEqual(resultados.map((r) => r.statusCode).sort(), [200, 409]); assert.equal(await stock(), 13);
  });
  await t.test("si falta un producto revierte todos los incrementos y la decisión", async () => {
    const p = await reset(); await Producto.deleteOne({ _id: productoB });
    assert.equal((await resolver(p, [3, 2])).statusCode, 409); assert.equal(await stock(), 10); assert.equal((await Pedido.findById(p._id)).reposicionStock.estado, "pendiente");
    assert.equal((await resolver(p, [3, 0])).statusCode, 200);
  });
  await t.test("pendientes antiguos visibles; pedidos legados y no cancelados no se reponen", async () => {
    let p = await reset(); const res = response(); await obtenerReposicionesPendientes(request(p._id), res); assert.equal(res.body.length, 1);
    await Pedido.updateOne({ _id: p._id }, { $unset: { reposicionStock: 1 } }); assert.equal((await resolver(p, [3, 2])).statusCode, 409);
    p = await reset("enviado"); assert.equal((await resolver(p, [3, 2])).statusCode, 409); assert.equal(await stock(), 10);
  });
  const prepararDevolucion = async () => {
    const p = await reset("en_camino");
    await Pedido.updateOne({ _id: p._id }, { $set: { tipoEntrega: "favorcito", repartidor: ajeno }, $unset: { reposicionStock: 1 } });
    return p;
  };
  const solicitar = (p, autor = ajeno, extra = {}) => llamar(solicitarDevolucion, p._id, autor, { motivo: "cliente_ausente", conservoPedido: true, ...extra });
  await t.test("solo el repartidor asignado que conserva el pedido puede solicitar devolución", async () => {
    const p = await prepararDevolucion();
    assert.equal((await solicitar(p, estudiante)).statusCode, 409);
    assert.equal((await solicitar(p, ajeno, { conservoPedido: false })).statusCode, 400);
    assert.equal((await solicitar(p, ajeno, { motivo: "otro" })).statusCode, 400);
    assert.equal((await solicitar(p)).statusCode, 200);
    assert.equal((await solicitar(p)).statusCode, 409);
    const actual = await Pedido.findById(p._id);
    assert.equal(actual.estado, "en_camino"); assert.equal(actual.devolucion.estado, "pendiente");
    assert.equal(actual.reposicionStock, undefined); assert.equal(await stock(), 10);
  });
  await t.test("una devolución pendiente no puede confirmarse como entrega ni cancelarse para reponer", async () => {
    const p = await prepararDevolucion(); await solicitar(p);
    assert.equal((await llamar(confirmarEntrega, p._id, ajeno)).statusCode, 409);
    assert.equal((await llamar(cancelarPedidoVendedor, p._id, vendedor)).statusCode, 409);
    assert.equal((await resolver(p, [3, 2])).statusCode, 409);
    assert.equal(await stock(), 10);
  });
  await t.test("el vendedor confirma la recepción antes de decidir reposición y sin sumar faltas", async () => {
    const p = await prepararDevolucion(); await solicitar(p);
    assert.equal((await llamar(recibirDevolucion, p._id, ajeno)).statusCode, 409);
    assert.equal((await llamar(recibirDevolucion, p._id, vendedor)).statusCode, 200);
    const actual = await Pedido.findById(p._id);
    assert.equal(actual.estado, "cancelado"); assert.equal(actual.canceladoPor, "devolucion");
    assert.equal(actual.devolucion.estado, "recibida"); assert.equal(String(actual.devolucion.recibidaPor), String(vendedor));
    assert.equal(actual.reposicionStock.estado, "pendiente"); assert.equal(await stock(), 10);
    assert.equal((await Usuario.findById(estudiante)).faltas, 0);
    assert.equal((await resolver(p, [1, 0])).statusCode, 200); assert.equal(await stock(), 11);
    assert.equal((await llamar(recibirDevolucion, p._id, vendedor)).statusCode, 409);
    assert.equal(evaluarReportePedido({ pedido: actual, usuarioId: ajeno, motivo: "cliente_ausente" }).ok, true);
  });
  await t.test("solicitar devolución y confirmar entrega simultáneamente no crea estados contradictorios", async () => {
    const p = await prepararDevolucion();
    const resultados = await Promise.all([solicitar(p), llamar(confirmarEntrega, p._id, ajeno)]);
    assert.deepEqual(resultados.map((r) => r.statusCode).sort(), [200, 409]);
    const actual = await Pedido.findById(p._id);
    assert.ok((actual.estado === "entregado" && !actual.devolucion) || (actual.estado === "en_camino" && actual.devolucion.estado === "pendiente"));
  });
  await t.test("las devoluciones pendientes solo se muestran al local propietario", async () => {
    const p = await prepararDevolucion(); await solicitar(p);
    let res = response(); await obtenerDevoluciones(request(p._id, vendedor), res); assert.equal(res.body.length, 1);
    res = response(); await obtenerDevoluciones(request(p._id, estudiante), res); assert.deepEqual(res.body, []);
  });

});
