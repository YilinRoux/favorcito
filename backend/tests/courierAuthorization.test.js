import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import Pedido from "../models/Pedido.js";
import { aceptarFavorcito, confirmarEntrega } from "../controllers/pedidoController.js";

const estudianteId = "507f1f77bcf86cd799439011";
const pedidoId = "507f1f77bcf86cd799439012";

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

const request = () => ({
  params: { pedidoId },
  usuario: { id: estudianteId },
  app: { get: () => ({ to: () => ({ emit: () => {} }) }) },
});

test("aceptar reparto exige pedido disponible y excluye pedido propio", async () => {
  const stub = mock.method(Pedido, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.estado, "listo");
    assert.equal(filter.tipoEntrega, "favorcito");
    assert.equal(filter.repartidor, null);
    assert.deepEqual(filter.estudiante, { $ne: estudianteId });
    assert.equal(update.$set.estado, "en_camino");
    return null;
  });
  try {
    const res = response();
    await aceptarFavorcito(request(), res);
    assert.equal(res.statusCode, 409);
    assert.equal(stub.mock.callCount(), 1);
  } finally { stub.mock.restore(); }
});

test("confirmar entrega exige repartidor asignado y estado en camino", async () => {
  const stub = mock.method(Pedido, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.repartidor, estudianteId);
    assert.equal(filter.estado, "en_camino");
    assert.equal(update.$set.estado, "entregado");
    return null;
  });
  try {
    const res = response();
    await confirmarEntrega(request(), res);
    assert.equal(res.statusCode, 409);
    assert.equal(stub.mock.callCount(), 1);
  } finally { stub.mock.restore(); }
});
