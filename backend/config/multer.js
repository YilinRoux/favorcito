import multer from "multer";
import crypto from "node:crypto";
import fs from "fs";
import path from "path";
import { hasCloudinaryConfig } from "./cloudinary.js";

const useCloudinaryStorage = hasCloudinaryConfig;

if (!useCloudinaryStorage) {
  fs.mkdirSync("uploads", { recursive: true });
}

const storage = useCloudinaryStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "uploads/");
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
      },
    });

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"));
  }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 5 } });
