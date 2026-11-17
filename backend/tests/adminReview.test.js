import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import adminRoutes from "../routes/adminRoutes.js";
import Local from "../models/Local.js";
import Pedido from "../models/Pedido.js";
import Reporte from "../models/Reporte.js";
import Usuario from "../models/Usuario.js";

test("HTTP: revisión administrativa distingue pendientes, ventas y cuenta propia", { skip: !process.env.MONGO_TEST_URI }, async (t) => {
  const anterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "admin-review-test-only";
  await mongoose.connect(process.env.MONGO_TEST_URI, { dbName: `admin_review_test_${new mongoose.Types.ObjectId()}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); if (anterior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = anterior; });
  const id = () => new mongoose.Types.ObjectId();
  const admin = id(), estudiante = id(), pendiente = id(), legado = id(), rechazado = id(), inactivo = id(), aprobado = id();
  await Usuario.collection.insertMany([
    { _id: admin, rol: "admin", nombre_completo: "Admin", password: "test-only", email: "admin@example.test", activo: true, verificado: true },
    { _id: estudiante, rol: "estudiante", nombre_completo: "Alumno", password: "test-only", email: "alumno@example.test", activo: true, verificado: true },
  ]);
  await Local.collection.insertMany([
    { _id: pendiente, nombre: "Pendiente", aprobado: false, rechazado: false, activo: true, vendedor: admin },
    { _id: legado, nombre: "Pendiente anterior", aprobado: false, vendedor: admin },
    { _id: rechazado, nombre: "Rechazado", aprobado: false, rechazado: true, vendedor: admin },
    { _id: inactivo, nombre: "Inactivo", aprobado: false, activo: false, vendedor: admin },
    { _id: aprobado, nombre: "Local con entregas", aprobado: true, vendedor: admin },
  ]);
  const pedidoReportado = id();
  await Pedido.collection.insertMany([
    ...Array.from({ length: 6 }, () => ({ local: rechazado, estado: "cancelado", total: 100, createdAt: new Date() })),
    { _id: pedidoReportado, local: aprobado, estado: "entregado", alias: "Ana12", productos: [{ cantidad: 1, nombre: "Tacos", precio: 45 }], total: 45, createdAt: new Date() },
    { local: aprobado, estado: "entregado", total: 55, createdAt: new Date() },
  ]);
  await Reporte.create({ reportante: estudiante, tipoReportado: "estudiante", estudianteReportado: admin, motivo: "no_pago", pedido: pedidoReportado });
  const app = express(); app.use(express.json()); app.use("/admin", adminRoutes);
  const server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const llamar = (path, user = admin, method = "GET") => fetch(`http://127.0.0.1:${server.address().port}/admin${path}`, { method, headers: { Authorization: `Bearer ${jwt.sign({ id: String(user) }, process.env.JWT_SECRET)}` } });
  await t.test("resumen y cola excluyen rechazados e inactivos y conservan registros antiguos", async () => {
    const lista = await (await llamar("/locales-pendientes")).json();
    assert.deepEqual(lista.map((l) => l._id).sort(), [String(pendiente), String(legado)].sort());
    const resumen = await (await llamar("/resumen")).json(); assert.equal(resumen.localesPendientes, 2); assert.equal(resumen.totalLocales, 5);
  });
  await t.test("local líder e importe se calculan sobre entregas", async () => {
    const stats = await (await llamar("/estadisticas")).json(); assert.equal(stats.localMasVentas, "Local con entregas"); assert.equal(stats.totalGenerado, 100);
  });
  await t.test("el reporte incluye el contexto del pedido para revisión", async () => {
    const reportes = await (await llamar("/reportes")).json();
    assert.equal(reportes[0].pedido.alias, "Ana12");
    assert.equal(reportes[0].pedido.estado, "entregado");
    assert.equal(reportes[0].pedido.productos[0].nombre, "Tacos");
  });
  await t.test("impide suspender la cuenta propia y permite gestionar otra", async () => {
    assert.equal((await llamar(`/usuarios/${admin}/suspender`, admin, "PUT")).status, 400);
    assert.equal((await Usuario.findById(admin)).activo, true);
    assert.equal((await llamar(`/usuarios/${estudiante}/suspender`, admin, "PUT")).status, 200);
    assert.equal((await Usuario.findById(estudiante)).activo, false);
    assert.equal((await llamar(`/usuarios/${estudiante}/reactivar`, admin, "PUT")).status, 200);
  });
  await t.test("rechaza lectura y cambios administrativos desde una cuenta de estudiante", async () => {
    assert.equal((await llamar("/resumen", estudiante)).status, 403);
    assert.equal((await llamar(`/usuarios/${admin}/suspender`, estudiante, "PUT")).status, 403);
  });
});
