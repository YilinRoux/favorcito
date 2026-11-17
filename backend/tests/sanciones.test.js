import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import Reporte from "../models/Reporte.js";
import Usuario from "../models/Usuario.js";
import Pedido from "../models/Pedido.js";
import { crearReportePedido, resolverReporte } from "../controllers/reporteController.js";
import {
  consecuenciaPorFaltas,
  evaluarReportePedido,
  suspensionVencida,
  aplicarFalta,
} from "../services/sanciones.js";

const CLIENTE = "507f1f77bcf86cd799439011";
const REPARTIDOR = "507f1f77bcf86cd799439022";
const AJENO = "507f1f77bcf86cd799439033";
const PEDIDO = "507f1f77bcf86cd799439044";
const ADMIN = "507f1f77bcf86cd799439055";
const ahora = new Date("2026-11-16T12:00:00Z");

const pedidoBase = (extra = {}) => ({
  _id: PEDIDO,
  estudiante: CLIENTE,
  repartidor: REPARTIDOR,
  tipoEntrega: "favorcito",
  estado: "entregado",
  historialEstados: [{ estado: "entregado", fecha: new Date("2026-11-16T10:00:00Z") }],
  ...extra,
});

const mockSession = (t) => {
  const session = {
    withTransaction: async (callback) => callback(),
    endSession: t.mock.fn(async () => {}),
  };
  t.mock.method(Reporte, "startSession", async () => session);
  return session;
};

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

test("la escalera: aviso, sospechoso, 7 días y baja", () => {
  assert.equal(consecuenciaPorFaltas(0).accion, "ninguna");
  assert.equal(consecuenciaPorFaltas(1).accion, "aviso");
  assert.equal(consecuenciaPorFaltas(2).accion, "sospechoso");
  assert.deepEqual(consecuenciaPorFaltas(3), { accion: "suspension", dias: 7 });
  assert.equal(consecuenciaPorFaltas(4).accion, "baja");
  assert.equal(consecuenciaPorFaltas(9).accion, "baja");
});

test("el repartidor reporta al cliente y el cliente al repartidor", () => {
  const r1 = evaluarReportePedido({ pedido: pedidoBase(), usuarioId: REPARTIDOR, motivo: "no_pago", ahora });
  assert.equal(r1.ok, true);
  assert.equal(r1.contexto, "repartidor_a_cliente");
  assert.equal(r1.reportadoId, CLIENTE);

  const r2 = evaluarReportePedido({ pedido: pedidoBase(), usuarioId: CLIENTE, motivo: "pedido_sucio_danado", ahora });
  assert.equal(r2.ok, true);
  assert.equal(r2.contexto, "cliente_a_repartidor");
  assert.equal(r2.reportadoId, REPARTIDOR);
});

test("rechaza a quien no participó, motivos cruzados, pedidos sin repartidor y plazo vencido", () => {
  assert.equal(evaluarReportePedido({ pedido: pedidoBase(), usuarioId: AJENO, motivo: "no_pago", ahora }).status, 403);
  // el cliente no puede usar motivos del repartidor ni al revés
  assert.equal(evaluarReportePedido({ pedido: pedidoBase(), usuarioId: CLIENTE, motivo: "no_pago", ahora }).status, 400);
  assert.equal(evaluarReportePedido({ pedido: pedidoBase(), usuarioId: REPARTIDOR, motivo: "mal_trato", ahora }).status, 400);
  assert.equal(evaluarReportePedido({ pedido: pedidoBase({ tipoEntrega: "recoger", repartidor: undefined }), usuarioId: CLIENTE, motivo: "mal_trato", ahora }).status, 400);
  assert.equal(evaluarReportePedido({ pedido: pedidoBase({ estado: "listo" }), usuarioId: CLIENTE, motivo: "mal_trato", ahora }).status, 400);
  const viejo = pedidoBase({ historialEstados: [{ estado: "entregado", fecha: new Date("2026-11-10T10:00:00Z") }] });
  assert.match(evaluarReportePedido({ pedido: viejo, usuarioId: CLIENTE, motivo: "mal_trato", ahora }).mensaje, /plazo/);
  assert.equal(evaluarReportePedido({ pedido: null, usuarioId: CLIENTE, motivo: "mal_trato", ahora }).status, 404);
});

test("la suspensión temporal vence sola, la baja definitiva no", () => {
  const pasado = new Date("2026-11-01T00:00:00Z");
  assert.equal(suspensionVencida({ activo: false, suspendidoHasta: pasado }, ahora), true);
  assert.equal(suspensionVencida({ activo: false, suspendidoHasta: new Date("2026-12-01") }, ahora), false);
  assert.equal(suspensionVencida({ activo: false, bajaDefinitiva: true, suspendidoHasta: pasado }, ahora), false);
  assert.equal(suspensionVencida({ activo: true, suspendidoHasta: pasado }, ahora), false);
  assert.equal(suspensionVencida({ activo: false }, ahora), false);
});

test("la tercera falta suspende 7 días y la cuarta da de baja", async (t) => {
  const cambios = [];
  t.mock.method(Usuario, "updateOne", async (_f, u) => { cambios.push(u.$set); return {}; });

  t.mock.method(Usuario, "findByIdAndUpdate", async () => ({ faltas: 3 }));
  const tercera = await aplicarFalta(CLIENTE);
  assert.equal(tercera.accion, "suspension");
  assert.equal(cambios[0].activo, false);
  assert.ok(cambios[0].suspendidoHasta > new Date(Date.now() + 6.9 * 864e5));

  Usuario.findByIdAndUpdate.mock.restore();
  t.mock.method(Usuario, "findByIdAndUpdate", async () => ({ faltas: 4 }));
  await aplicarFalta(CLIENTE);
  assert.equal(cambios[1].bajaDefinitiva, true);
  assert.equal(cambios[1].suspendidoHasta, null);
});

test("crearReportePedido guarda el reporte con el reportado calculado en el servidor", async (t) => {
  t.mock.method(Pedido, "findById", () => ({ select: async () => pedidoBase() }));
  let creado;
  t.mock.method(Reporte, "create", async (datos) => { creado = datos; return { _id: "r1" }; });

  const res = response();
  await crearReportePedido({
    params: { pedidoId: PEDIDO },
    // el cliente intenta colarse como si reportara a otra persona: se ignora
    body: { motivo: "pedido_incompleto", descripcion: "  faltó un taco  ", estudianteReportado: AJENO },
    usuario: { _id: CLIENTE },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(String(creado.estudianteReportado), REPARTIDOR);
  assert.equal(creado.contexto, "cliente_a_repartidor");
  assert.equal(creado.descripcion, "faltó un taco");
});

test("un segundo reporte del mismo pedido responde 409", async (t) => {
  t.mock.method(Pedido, "findById", () => ({ select: async () => pedidoBase() }));
  t.mock.method(Reporte, "create", async () => { const e = new Error("dup"); e.code = 11000; throw e; });
  const res = response();
  await crearReportePedido({ params: { pedidoId: PEDIDO }, body: { motivo: "mal_trato" }, usuario: { _id: CLIENTE } }, res);
  assert.equal(res.statusCode, 409);
});

test("resolver procedente suma falta (y bloquea si fue no_pago); improcedente penaliza al reportante", async (t) => {
  mockSession(t);
  const reporte = { _id: "r1", reportante: REPARTIDOR, estudianteReportado: CLIENTE, tipoReportado: "estudiante", motivo: "no_pago" };
  t.mock.method(Reporte, "findOneAndUpdate", async () => reporte);
  const sets = [];
  t.mock.method(Usuario, "updateOne", async (_f, u) => { sets.push(u.$set); return {}; });
  t.mock.method(Usuario, "findByIdAndUpdate", async () => ({ faltas: 1 }));

  const res = response();
  await resolverReporte({ params: { id: PEDIDO }, body: { decision: "procedente" }, usuario: { _id: ADMIN } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sancion.accion, "aviso");
  assert.ok(sets.some((s) => s.bloqueoPorPago === true));

  Usuario.findByIdAndUpdate.mock.restore();
  t.mock.method(Usuario, "findByIdAndUpdate", async () => ({ _id: REPARTIDOR, reportesImprocedentes: 3, sospechoso: false }));
  const res2 = response();
  await resolverReporte({ params: { id: PEDIDO }, body: { decision: "improcedente" }, usuario: { _id: ADMIN } }, res2);
  assert.equal(res2.statusCode, 200);
  assert.ok(sets.some((s) => s.sospechoso === true));
});

test("resolver exige una decisión válida y no repite reportes ya resueltos", async (t) => {
  const res = response();
  await resolverReporte({ params: { id: PEDIDO }, body: { decision: "cualquiera" }, usuario: { _id: ADMIN } }, res);
  assert.equal(res.statusCode, 400);

  mockSession(t);
  t.mock.method(Reporte, "findOneAndUpdate", async () => null);
  const res2 = response();
  await resolverReporte({ params: { id: PEDIDO }, body: { decision: "procedente" }, usuario: { _id: ADMIN } }, res2);
  assert.equal(res2.statusCode, 409);
});

void mock;
