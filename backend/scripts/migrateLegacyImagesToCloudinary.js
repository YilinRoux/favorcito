import fs from "fs";
import fsPromises from "fs/promises";
import dns from "dns";
import path from "path";
import dotenv from "dotenv";

const cwd = process.cwd();
const defaultLegacyBaseUrl = "https://favorcito-full.onrender.com";

const envCandidates = [
  path.resolve(cwd, ".env"),
  path.resolve(cwd, "backend/.env"),
  path.resolve(cwd, "../backend/.env"),
];

const dnsServers = (process.env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
}

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const { default: mongoose } = await import("mongoose");
const { default: Local } = await import("../models/Local.js");
const { default: Producto } = await import("../models/Producto.js");
const { guardarImagen } = await import("../services/imageStorage.js");
const { hasCloudinaryConfig } = await import("../config/cloudinary.js");

const isRemoteUrl = (value) => /^https?:\/\//i.test(value || "");
const isCloudinaryUrl = (value) => typeof value === "string" && value.includes("res.cloudinary.com");

const normalizeLegacyName = (value) => path.basename(String(value || "").trim());

const unique = (values) => [...new Set(values.filter(Boolean))];

async function readImageBuffer(legacyValue) {
  const filename = normalizeLegacyName(legacyValue);
  if (!filename) return null;

  const localCandidates = unique([
    path.resolve(cwd, "backend/uploads", filename),
    path.resolve(cwd, "uploads", filename),
    path.resolve(cwd, "backend/public/uploads", filename),
  ]);

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return {
        buffer: await fsPromises.readFile(candidate),
        source: candidate,
      };
    }
  }

  const baseUrl = (process.env.LEGACY_UPLOADS_BASE_URL || defaultLegacyBaseUrl).replace(/\/$/, "");
  const remoteUrl = `${baseUrl}/uploads/${encodeURIComponent(filename)}`;

  try {
    const response = await fetch(remoteUrl, { method: "GET" });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      source: remoteUrl,
    };
  } catch {
    return null;
  }
}

async function migrateOneImage(legacyValue, folder, stats) {
  if (!legacyValue) return legacyValue;
  if (isCloudinaryUrl(legacyValue) || isRemoteUrl(legacyValue) && !legacyValue.includes("/uploads/")) {
    stats.alreadyMigrated += 1;
    return legacyValue;
  }

  const imageData = await readImageBuffer(legacyValue);
  if (!imageData) {
    stats.missing += 1;
    console.log(`SKIP  ${legacyValue}  (archivo no encontrado)`);
    return legacyValue;
  }

  const uploadedUrl = await guardarImagen(
    {
      buffer: imageData.buffer,
      originalname: normalizeLegacyName(legacyValue),
    },
    folder
  );

  if (!uploadedUrl) {
    stats.missing += 1;
    console.log(`SKIP  ${legacyValue}  (falló la subida)`);
    return legacyValue;
  }

  stats.migrated += 1;
  console.log(`MIGR  ${legacyValue}  ->  ${uploadedUrl}`);
  return uploadedUrl;
}

async function migrateProductos(stats) {
  const productos = await Producto.find({ imagen: { $exists: true, $ne: "" } });

  for (const producto of productos) {
    const current = producto.imagen;
    if (!current) continue;

    const updated = await migrateOneImage(current, "favorcito/productos", stats);
    if (updated !== current) {
      producto.imagen = updated;
      await producto.save();
      stats.saved += 1;
    }
  }
}

async function migrateLocales(stats) {
  const locales = await Local.find({
    $or: [
      { fotos: { $exists: true, $ne: [] } },
      { imagenesAnuncios: { $exists: true, $ne: [] } },
    ],
  });

  for (const local of locales) {
    let changed = false;

    if (Array.isArray(local.fotos) && local.fotos.length > 0) {
      const nextFotos = [];
      for (const foto of local.fotos) {
        const updated = await migrateOneImage(foto, "favorcito/locales", stats);
        nextFotos.push(updated);
        if (updated !== foto) changed = true;
      }
      local.fotos = nextFotos;
    }

    if (Array.isArray(local.imagenesAnuncios) && local.imagenesAnuncios.length > 0) {
      const nextAnuncios = [];
      for (const imagen of local.imagenesAnuncios) {
        const updated = await migrateOneImage(imagen, "favorcito/promociones", stats);
        nextAnuncios.push(updated);
        if (updated !== imagen) changed = true;
      }
      local.imagenesAnuncios = nextAnuncios;
    }

    if (changed) {
      await local.save();
      stats.saved += 1;
    }
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI no está configurado");
  }

  if (!hasCloudinaryConfig) {
    throw new Error("Cloudinary no está configurado. Define CLOUDINARY_URL o las 3 variables separadas.");
  }

  const stats = {
    migrated: 0,
    missing: 0,
    saved: 0,
    alreadyMigrated: 0,
  };

  await mongoose.connect(process.env.MONGO_URI);

  try {
    await migrateProductos(stats);
    await migrateLocales(stats);

    console.log("");
    console.log("Resumen de migración:");
    console.log(`- Migradas: ${stats.migrated}`);
    console.log(`- Ya en Cloudinary o externas: ${stats.alreadyMigrated}`);
    console.log(`- Sin archivo origen: ${stats.missing}`);
    console.log(`- Documentos guardados: ${stats.saved}`);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error("Error migrando imágenes:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
