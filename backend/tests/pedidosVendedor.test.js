import test from "node:test";
import assert from "node:assert/strict";
import Local from "../models/Local.js";
import Pedido from "../models/Pedido.js";
import { obtenerPedidosVendedor } from "../controllers/pedidoController.js";

test("el vendedor recibe lo que sigue abierto y solo 14 días de historial", async (t) => {
  t.mock.method(Local, "find", async () => [{ _id: "L1" }, { _id: "L2" }]);
  let filtro;
  t.mock.method(Pedido, "find", (f) => {
    filtro = f;
    return { populate: () => ({ sort: async () => [{ _id: "P1" }] }) };
  });

  const res = { json(v) { this.body = v; return this; }, status() { return this; } };
  await obtenerPedidosVendedor({ usuario: { id: "V1" } }, res);

  assert.deepEqual(filtro.local.$in, ["L1", "L2"]);
  const [abiertos, recientes] = filtro.$or;
  assert.deepEqual(abiertos.estado.$in, ["enviado", "aceptado", "en_preparacion", "listo", "en_camino"]);
  const dias = (Date.now() - recientes.createdAt.$gte.getTime()) / 864e5;
  assert.ok(dias > 13.99 && dias < 14.01);
  assert.deepEqual(res.body, [{ _id: "P1" }]);
});
