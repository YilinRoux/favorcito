import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Producto from "../models/Producto.js";
import Pedido from "../models/Pedido.js";

const id = () => new mongoose.Types.ObjectId();

test("producto rechaza precio negativo y stock negativo", () => {
  const producto = new Producto({ nombre: "Prueba", descripcion: "Prueba", precio: -1, stock: -2, local: id() });
  const error = producto.validateSync();
  assert.ok(error?.errors.precio);
  assert.ok(error?.errors.stock);
});

test("pedido rechaza cantidad fraccionaria y precio negativo", () => {
  const pedido = new Pedido({
    estudiante: id(), local: id(), tipoEntrega: "recoger", total: 10,
    productos: [{ producto: id(), nombre: "Prueba", precio: -1, cantidad: 1.5 }],
  });
  const error = pedido.validateSync();
  assert.ok(error?.errors["productos.0.precio"]);
  assert.ok(error?.errors["productos.0.cantidad"]);
});

test("pedido rechaza total negativo y entrega desconocida", () => {
  const pedido = new Pedido({ estudiante: id(), local: id(), tipoEntrega: "otro", total: -10 });
  const error = pedido.validateSync();
  assert.ok(error?.errors.total);
  assert.ok(error?.errors.tipoEntrega);
});

test("pedido válido pasa validación de esquema", () => {
  const pedido = new Pedido({
    estudiante: id(), local: id(), tipoEntrega: "favorcito", total: 35,
    productos: [{ producto: id(), nombre: "Prueba", precio: 20, cantidad: 1 }],
  });
  assert.equal(pedido.validateSync(), undefined);
});
