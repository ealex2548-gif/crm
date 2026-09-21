import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// Mesma pasta `data/` usada pelo arquivo SQLite — já é volume persistente
// no docker-compose. Serve local por enquanto; trocar por S3/MinIO depois
// é só mudar este arquivo (mesmo padrão do whatsappProvider).
const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo não permitido"));
    }
    cb(null, true);
  },
});

export const UPLOAD_DIR_PATH = UPLOAD_DIR;
