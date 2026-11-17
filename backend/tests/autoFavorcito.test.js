import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";
import Usuario from "../models/Usuario.js";
import Local from "../models/Local.js";
import pedidoRoutes from "../routes/pedidoRoutes.js";

// Instancia exclusiva de pruebas con replica set; no usa la conexión de producción.
// Desde backend: MONGO_TEST_URI='mongodb://127.0.0.1:27019/?replicaSet=favorcitoTest' node --test tests/*.test.js

test("HTTP: un estudiante no puede hacerse un auto Favorcito", { skip: !process.env.MONGO_TEST_URI }, async (t) => {
  const secretAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "auto-favorcito-test-secret-only";
  await mongoose.connect(process.env.MONGO_TEST_URI, { dbName: `auto_favorcito_test_${new mongoose.Types.ObjectId()}` });
  t.after(async () => {
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
    if (secretAnterior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secretAnterior;
  });
  await Promise.all([Pedido.init(), Usuario.init(), Local.init()]);
  const [cliente, otro, local, producto] = Array.from({ length: 4 }, () => new mongoose.Types.ObjectId());
  await Usuario.collection.insertMany([
    { _id: cliente, nombre_completo: "Cliente", email: "cliente@example.test", rol: "estudiante", activo: true, verificado: true },
    { _id: otro, nombre_completo: "Otro estudiante", email: "otro@example.test", rol: "estudiante", activo: true, verificado: true },
  ]);
  await Local.collection.insertOne({ _id: local, nombre: "Local de pruebas", direccion: "Campus" });
  const crear = (estudiante) => Pedido.create({ estudiante, local, tipoEntrega: "favorcito", estado: "listo", productos: [{ producto, nombre: "Tacos", cantidad: 2, precio: 20 }], total: 55, costoEnvio: 15 });
  const propio = await crear(cliente); const ajeno = await crear(otro);
  const app = express(); app.use(express.json());
  app.set("io", { to: () => ({ emit() {} }) });
  app.use("/api/pedidos", pedidoRoutes);
  const server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}/api/pedidos`;
  const llamar = async (path, usuario, method = "GET", body) => {
    const headers = { "Content-Type": "application/json" };
    if (usuario) headers.Authorization = `Bearer ${jwt.sign({ id: String(usuario) }, process.env.JWT_SECRET, { algorithm: "HS256" })}`;
    return fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  };
  await t.test("solo muestra repartos ajenos a la cuenta autenticada", async () => {
    assert.equal((await llamar("/favorcito/disponibles")).status, 401);
    const res = await llamar("/favorcito/disponibles", cliente);
    assert.equal(res.status, 200);
    const lista = await res.json();
    assert.deepEqual(lista.map((p) => p._id), [String(ajeno._id)]);
  });
  await t.test("rechaza aceptar el pedido propio aunque el cuerpo intente suplantar al repartidor", async () => {
    const res = await llamar(`/favorcito/${propio._id}/aceptar`, cliente, "PUT", { estudiante: String(otro), repartidor: String(otro), usuario: { id: String(otro) } });
    assert.equal(res.status, 409);
    const p = await Pedido.findById(propio._id);
    assert.equal(p.estado, "listo"); assert.equal(p.repartidor, undefined);
  });
  await t.test("otro estudiante sí puede aceptar y entregar el mismo pedido", async () => {
    assert.equal((await llamar(`/favorcito/${propio._id}/aceptar`, otro, "PUT")).status, 200);
    assert.equal(String((await Pedido.findById(propio._id)).repartidor), String(otro));
    assert.equal((await llamar(`/favorcito/${propio._id}/entregar`, cliente, "PUT")).status, 409);
    assert.equal((await llamar(`/favorcito/${propio._id}/entregar`, otro, "PUT")).status, 200);
    assert.equal((await Pedido.findById(propio._id)).estado, "entregado");
  });
  await t.test("tampoco permite confirmar un registro antiguo con cliente y repartidor iguales", async () => {
    const p = await crear(cliente);
    await Pedido.updateOne({ _id: p._id }, { $set: { repartidor: cliente, estado: "en_camino" } });
    assert.equal((await llamar(`/favorcito/${p._id}/entregar`, cliente, "PUT")).status, 409);
    assert.equal((await Pedido.findById(p._id)).estado, "en_camino");
  });
});
