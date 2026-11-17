import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";
import Local from "../models/Local.js";
import Producto from "../models/Producto.js";
import authRoutes from "../routes/authRoutes.js";
import productoRoutes from "../routes/productoRoutes.js";
import pedidoRoutes from "../routes/pedidoRoutes.js";
import reporteRoutes from "../routes/reporteRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import chatRoutes from "../routes/chatRoutes.js";

test("flujo completo con cuentas reales de estudiante, vendedor y administrador", { skip: !process.env.MONGO_TEST_URI }, async (t) => {
  const secretAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "release-flow-test-only";
  await mongoose.connect(process.env.MONGO_TEST_URI, { dbName: `release_flow_test_${new mongoose.Types.ObjectId()}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); if (secretAnterior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secretAnterior; });
  const password = "FavorcitoTest2026!";
  const hash = await bcrypt.hash(password, 10);
  const cuentas = {};
  for (const [nombre, rol] of [["cliente", "estudiante"], ["repartidor", "estudiante"], ["vendedor", "vendedor"], ["admin", "admin"]]) {
    cuentas[nombre] = await Usuario.create({ nombre_completo: nombre, email: `${nombre}@example.test`, password: hash, rol, activo: true, verificado: true });
  }
  const local = await Local.create({ nombre: "Local de pruebas", descripcion: "Comida del campus", direccion: "Campus", aprobado: true, vendedor: cuentas.vendedor._id });
  const app = express(); app.use(express.json()); app.set("io", { to: () => ({ emit() {} }), in: () => ({ socketsJoin() {} }) });
  for (const [ruta, router] of [["auth", authRoutes], ["productos", productoRoutes], ["pedidos", pedidoRoutes], ["reportes", reporteRoutes], ["admin", adminRoutes], ["chat", chatRoutes]]) app.use(`/api/${ruta}`, router);
  const server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const tokens = {};
  const llamar = async (path, cuenta, method = "GET", body, esperado = 200) => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers: { "Content-Type": "application/json", ...(tokens[cuenta] ? { Authorization: `Bearer ${tokens[cuenta]}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await res.json(); assert.equal(res.status, esperado, `${method} ${path}: ${JSON.stringify(data)}`); return data;
  };
  let producto, pedido;
  await t.test("inicia sesión con contraseñas verificadas para los tres roles", async () => {
    for (const nombre of Object.keys(cuentas)) {
      const data = await llamar("/auth/login", null, "POST", { email: cuentas[nombre].email, password });
      tokens[nombre] = data.token; assert.equal(data.usuario.rol, cuentas[nombre].rol);
    }
  });
  await t.test("vendedor publica producto y estudiante compra con precio calculado en servidor", async () => {
    const data = await llamar("/productos", "vendedor", "POST", { localId: local.id, nombre: "Tacos", descripcion: "Tacos de prueba", categoria: "Tacos", precio: 20, stock: 10 }, 201);
    producto = data.producto;
    const catalogo = await llamar(`/productos/local/${local.id}`, "cliente"); assert.equal(catalogo[0].nombre, "Tacos");
    pedido = (await llamar("/pedidos", "cliente", "POST", { productos: [{ producto: producto._id, cantidad: 2, precio: 1 }], tipoEntrega: "favorcito", total: 1 }, 201)).pedido;
    assert.equal(pedido.total, 55); assert.equal((await Producto.findById(producto._id)).stock, 8);
    assert.equal((await llamar("/pedidos/vendedor", "vendedor"))[0]._id, pedido._id);
    await llamar("/admin/resumen", "cliente", "GET", undefined, 403);
  });
  await t.test("vendedor prepara; un estudiante diferente recoge, conversa y entrega", async () => {
    await llamar(`/pedidos/${pedido._id}/aceptar`, "vendedor", "PUT");
    for (const nuevoEstado of ["listo"]) await llamar(`/pedidos/${pedido._id}/estado`, "vendedor", "PUT", { nuevoEstado });
    assert.equal((await llamar("/pedidos/favorcito/disponibles", "cliente")).length, 0);
    await llamar(`/pedidos/favorcito/${pedido._id}/aceptar`, "cliente", "PUT", undefined, 409);
    await llamar(`/pedidos/favorcito/${pedido._id}/aceptar`, "repartidor", "PUT");
    await llamar(`/chat/${pedido._id}`, "repartidor", "POST", { mensaje: "Estoy junto a la biblioteca" }, 201);
    assert.equal((await llamar(`/chat/${pedido._id}`, "cliente"))[0].mensaje, "Estoy junto a la biblioteca");
    await llamar(`/pedidos/favorcito/${pedido._id}/entregar`, "repartidor", "PUT");
    assert.equal((await llamar(`/pedidos/${pedido._id}`, "cliente")).estado, "entregado");
  });
  await t.test("administrador revisa un reporte del pedido y confirma una sola sanción", async () => {
    await llamar(`/reportes/pedido/${pedido._id}`, "cliente", "POST", { motivo: "pedido_incompleto", descripcion: "Faltó un producto" }, 201);
    const reportes = await llamar("/admin/reportes", "admin"); assert.equal(reportes[0].pedido.estado, "entregado");
    await llamar(`/admin/reportes/${reportes[0]._id}/resolver`, "admin", "PUT", { decision: "procedente" });
    await llamar(`/admin/reportes/${reportes[0]._id}/resolver`, "admin", "PUT", { decision: "procedente" }, 409);
    assert.equal((await Usuario.findById(cuentas.repartidor._id)).faltas, 1);
    assert.equal((await llamar("/admin/estadisticas", "admin")).totalGenerado, 55);
  });
  await t.test("cancelación conserva inventario hasta la decisión explícita del vendedor", async () => {
    const cancelable = (await llamar("/pedidos", "cliente", "POST", { productos: [{ producto: producto._id, cantidad: 1 }], tipoEntrega: "recoger" }, 201)).pedido;
    await llamar(`/pedidos/${cancelable._id}/cancelar`, "cliente", "PUT");
    assert.equal((await Producto.findById(producto._id)).stock, 7);
    assert.equal((await llamar("/pedidos/reposiciones-pendientes", "vendedor")).length, 1);
    await llamar(`/pedidos/${cancelable._id}/reposicion`, "vendedor", "PUT", { cantidades: [1] });
    await llamar(`/pedidos/${cancelable._id}/reposicion`, "vendedor", "PUT", { cantidades: [1] }, 409);
    assert.equal((await Producto.findById(producto._id)).stock, 8);
  });
});
