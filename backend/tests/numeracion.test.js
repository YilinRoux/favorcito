import test from "node:test";
import assert from "node:assert/strict";
import Pedido from "../models/Pedido.js";
import Contador from "../models/Contador.js";
import { aceptarPedido } from "../controllers/pedidoController.js";
import { aliasPedido, diaMexico, limpiarAtiende, limpiarNotas, siguienteNumero } from "../services/numeracion.js";

const VENDEDOR = "507f1f77bcf86cd799439011";
const PEDIDO = "507f1f77bcf86cd799439012";

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

test("el día cambia a medianoche de México, no de UTC", () => {
  assert.equal(diaMexico(new Date("2026-11-17T05:30:00Z")), "2026-11-16");
  assert.equal(diaMexico(new Date("2026-11-17T06:30:00Z")), "2026-11-17");
});

test("el alias usa el primer nombre en voz alta: Ana12", () => {
  assert.equal(aliasPedido("ana maría torres", 12), "Ana12");
  assert.equal(aliasPedido("JOSÉ LUIS", 5), "José5");
  assert.equal(aliasPedido("Maximiliano Pérez", 9), "Maximilian9");
  assert.equal(aliasPedido("123 !!", 3), "Cliente3");
  assert.equal(aliasPedido(undefined, 1), "Cliente1");
});

test("notas y nombre de quien prepara se limpian", () => {
  assert.equal(limpiarNotas("  sin   cebolla \n por favor "), "sin cebolla por favor");
  assert.equal(limpiarNotas("   "), undefined);
  assert.equal(limpiarNotas(42), undefined);
  assert.equal(limpiarNotas("x".repeat(300)).length, 140);
  assert.equal(limpiarAtiende("Luis!!<b>"), "Luisb");
  assert.equal(limpiarAtiende(""), undefined);
});

test("el número del día se pide de forma atómica dentro de la transacción", async (t) => {
  let recibido;
  t.mock.method(Contador, "findOneAndUpdate", async (...args) => { recibido = args; return { seq: 7 }; });
  const sesion = { id: "sesion" };
  assert.equal(await siguienteNumero("L1", "2026-11-16", sesion), 7);
  assert.deepEqual(recibido[0], { _id: "L1:2026-11-16" });
  assert.deepEqual(recibido[1], { $inc: { seq: 1 } });
  assert.deepEqual(recibido[2], { new: true, upsert: true, session: sesion });
});

test("aceptar pasa directo a preparación, guarda quién lo prepara y deja ambos pasos en el historial", async (t) => {
  const pedido = { _id: PEDIDO, estado: "enviado", local: { vendedor: { toString: () => VENDEDOR } } };
  t.mock.method(Pedido, "findById", () => ({ populate: async () => pedido }));
  let update;
  t.mock.method(Pedido, "findOneAndUpdate", async (_f, u) => { update = u; return { _id: PEDIDO, estado: "en_preparacion" }; });
  const emitidos = [];
  const req = {
    params: { pedidoId: PEDIDO },
    body: { tiempoEstimado: 20, atiende: "Luis!!" },
    usuario: { id: VENDEDOR },
    app: { get: () => ({ to: () => ({ emit: (evento, datos) => emitidos.push([evento, datos]) }) }) },
  };
  const res = response();
  await aceptarPedido(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(update.$set.estado, "en_preparacion");
  assert.equal(update.$set.atendidoPor, "Luis");
  assert.equal(update.$set.tiempoEstimado, 20);
  assert.deepEqual(update.$push.historialEstados.$each.map((h) => h.estado), ["aceptado", "en_preparacion"]);
  assert.deepEqual(emitidos[0], ["estadoActualizado", { estado: "en_preparacion" }]);
});

test("aceptar sigue rechazando a otro vendedor y pedidos ya procesados", async (t) => {
  t.mock.method(Pedido, "findById", () => ({ populate: async () => ({ estado: "enviado", local: { vendedor: { toString: () => "otro" } } }) }));
  const res = response();
  await aceptarPedido({ params: { pedidoId: PEDIDO }, body: {}, usuario: { id: VENDEDOR } }, res);
  assert.equal(res.statusCode, 403);

  Pedido.findById.mock.restore();
  t.mock.method(Pedido, "findById", () => ({ populate: async () => ({ estado: "listo", local: { vendedor: { toString: () => VENDEDOR } } }) }));
  const res2 = response();
  await aceptarPedido({ params: { pedidoId: PEDIDO }, body: {}, usuario: { id: VENDEDOR } }, res2);
  assert.equal(res2.statusCode, 400);
});
