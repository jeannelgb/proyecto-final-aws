const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router();
const upload = require("../middlewares/upload");
const s3 = require("../aws/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const Alumno = require("../models/Alumno");

// 🔍 Validation
function validarAlumno(body) {
  if (!body) return false;
  if (!body.nombres || typeof body.nombres !== "string") return false;
  if (!body.apellidos || typeof body.apellidos !== "string") return false;
  if (typeof body.matricula !== "string" || body.matricula.length < 2) return false;
  if (typeof body.promedio !== "number" || body.promedio < 0) return false;
  if (!body.password || typeof body.password !== "string") return false;
  return true;
}

// -------------------------------------------------------------
// GET /alumnos
// -------------------------------------------------------------
router.get("/", async (req, res) => {
  const alumnos = await Alumno.findAll();
  res.status(200).json(alumnos);
});

// -------------------------------------------------------------
// POST /alumnos
// -------------------------------------------------------------
router.post("/", async (req, res) => {
  if (!validarAlumno(req.body)) {
    return res.status(400).json({ error: "Campos inválidos" });
  }

  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const nuevo = await Alumno.create({
      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      matricula: req.body.matricula,
      promedio: req.body.promedio,
      password: hashed,
      fotoPerfilUrl: null
    });

    const toReturn = nuevo.toJSON();
    delete toReturn.password;

    res.status(201).json(toReturn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando alumno" });
  }
});

// -------------------------------------------------------------
// GET /alumnos/:id
// -------------------------------------------------------------
router.get("/:id", async (req, res) => {
  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

  res.status(200).json(alumno);
});

// -------------------------------------------------------------
// PUT /alumnos/:id
// -------------------------------------------------------------
router.put("/:id", async (req, res) => {
  if (!validarAlumno(req.body)) {
    return res.status(400).json({ error: "Campos inválidos" });
  }

  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

  await alumno.update(req.body);
  res.status(200).json(alumno);
});

// -------------------------------------------------------------
// DELETE /alumnos/:id
// -------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

  await alumno.destroy();
  res.status(200).json({});
});

// -------------------------------------------------------------
// POST /alumnos/:id/fotoPerfil  → upload a S3
// -------------------------------------------------------------
router.post("/:id/fotoPerfil", upload.single("foto"), async (req, res) => {
  try {
    const alumno = await Alumno.findByPk(req.params.id);
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    if (!req.file) return res.status(400).json({ error: "No se envió ninguna imagen" });

    // Nombre del archivo en S3
    const fileName = `alumnos/${alumno.id}_${Date.now()}.jpg`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: req.file.buffer,
      ACL: "public-read",
      ContentType: req.file.mimetype
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`;

    // Actualizar el alumno
    alumno.fotoPerfilUrl = fileUrl;
    await alumno.save();

    res.status(200).json({ fotoPerfilUrl: fileUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error subiendo la imagen a S3" });
  }
});

module.exports = router;