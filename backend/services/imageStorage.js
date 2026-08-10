import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

const normalizeLocalPath = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });

const extractCloudinaryPublicId = (url) => {
  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) return null;

  let publicId = url.slice(markerIndex + marker.length);
  publicId = publicId.replace(/^v\d+\//, "");
  publicId = publicId.replace(/\.[^.]+$/, "");
  return publicId;
};

export const guardarImagen = async (file, folder) => {
  if (!file) return "";

  if (hasCloudinaryConfig) {
    return uploadToCloudinary(file, folder);
  }

  if (process.env.NODE_ENV === "production") {
    const error = new Error("El almacenamiento de imágenes no está configurado en producción");
    error.code = "IMAGE_STORAGE_NOT_CONFIGURED";
    throw error;
  }

  return normalizeLocalPath(`/uploads/${file.filename}`);
};

export const guardarImagenes = async (files = [], folder) => {
  if (!files.length) return [];
  return Promise.all(files.map((file) => guardarImagen(file, folder)));
};

export const eliminarImagenGuardada = async (url) => {
  if (!url) return;

  if (hasCloudinaryConfig && url.includes("res.cloudinary.com")) {
    const publicId = extractCloudinaryPublicId(url);

    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch {
      // No bloqueamos el flujo principal si la limpieza remota falla.
    }

    return;
  }

  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "uploads", path.basename(url));
    try {
      await fs.unlink(filePath);
    } catch {
      // Archivo ausente o no borrable; no interrumpimos la petición.
    }
  }
};
