import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import { protegerRuta, soloAdmin } from "../middlewares/authMiddleware.js";

const secret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "test-only-secret-not-for-production";

const run = async (authorization) => {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let nextCalled = false;
  await protegerRuta(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
};

test("rechaza autorización ausente o malformada", async () => {
  for (const header of [undefined, "Basic abc", "Bearer", "Bearer uno dos"]) {
    const result = await run(header);
    assert.equal(result.res.statusCode, 401);
    assert.equal(result.nextCalled, false);
  }
});

test("rechaza JWT inválido o con algoritmo distinto", async () => {
  const unsigned = jwt.sign({ id: "507f1f77bcf86cd799439011" }, "unused", { algorithm: "HS384" });
  for (const header of ["Bearer no-es-jwt", "Bearer " + unsigned]) {
    const result = await run(header);
    assert.equal(result.res.statusCode, 401);
  }
});

test("rechaza tokens sin identificador", async () => {
  const token = jwt.sign({ scope: "test" }, process.env.JWT_SECRET);
  assert.equal((await run("Bearer " + token)).res.statusCode, 401);
});

test("soloAdmin rechaza usuarios no administradores", () => {
  const req = { usuario: { rol: "estudiante" } };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json() { return this; } };
  let allowed = false;
  soloAdmin(req, res, () => { allowed = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(allowed, false);
});

test("soloAdmin permite administradores", () => {
  let allowed = false;
  soloAdmin({ usuario: { rol: "admin" } }, {}, () => { allowed = true; });
  assert.equal(allowed, true);
});

process.env.JWT_SECRET = secret;
