import test from 'node:test';
import assert from 'node:assert/strict';
import { agruparCocina, tiempoCocina } from '../src/utils/cocina.js';
const ahora = Date.parse('2026-11-17T16:00:00Z');
test('la preparación usa su inicio, no la antigüedad del pedido', () => {
 const t = tiempoCocina({estado:'en_preparacion',createdAt:'2026-11-16T00:00:00Z',historialEstados:[{estado:'en_preparacion',fecha:'2026-11-17T15:55:00Z'}]},ahora);
 assert.deepEqual(t,{etiqueta:'En preparación',texto:'5 min',clase:''});
});
test('sin historial no inventa tiempo de preparación ni urgencia', () => {
 assert.deepEqual(tiempoCocina({estado:'en_preparacion',createdAt:'2026-11-16T16:00:00Z'},ahora),{etiqueta:'Desde el pedido',texto:'24 h 0 min',clase:''});
 assert.equal(tiempoCocina({estado:'listo',createdAt:'invalida'},ahora).texto,'Tiempo no disponible');
});
test('espera de aceptación y urgencia coinciden', () => {
 const t=tiempoCocina({estado:'enviado',createdAt:'2026-11-17T15:35:00Z'},ahora);
 assert.equal(t.etiqueta,'Esperando aceptación');assert.equal(t.clase,' is-rojo');
});
test('incluye todos los abiertos y separa en camino y finalizados', () => {
 const pedidos=['enviado','aceptado','en_preparacion','listo','en_camino','entregado','cancelado'].map(estado=>({estado,createdAt:'2020-01-01'}));
 assert.deepEqual(agruparCocina(pedidos).map(([, ,lista])=>lista.map(p=>p.estado)),[['enviado'],['aceptado','en_preparacion'],['listo']]);
});
