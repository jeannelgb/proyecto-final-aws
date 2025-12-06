const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const s3 = require("../aws/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Alumno = require("../models/Alumno");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require('crypto');
const crypto = require('crypto');
const { PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = require("../aws/snsClient");

require('dotenv').config();

const REGION = process.env.AWS_REGION;
const TABLE = process.env.DYNAMO_TABLE_SESIONES;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const S3_BUCKET = process.env.S3_BUCKET;

const ddb = new DynamoDBClient({ region: REGION, credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN
}});
const docClient = DynamoDBDocumentClient.from(ddb);

function genSessionString() {
  return crypto.randomBytes(64).toString('hex');
}

// Validación
function validarAlumno(body) {
  if (!body) return false;
  if (!body.nombres || typeof body.nombres !== "string") return false;
  if (!body.apellidos || typeof body.apellidos !== "string") return false;
  if (typeof body.matricula !== "string" || body.matricula.length < 2) return false;
  if (typeof body.promedio !== "number" || body.promedio < 0) return false;
  if (!body.password || typeof body.password !== "string") return false;
  return true;
}

function limpiarAlumno(a) {
  const obj = a.toJSON();
  delete obj.password;
  return obj;
}

// GET /alumnos
router.get("/", async (req, res) => {
  const alumnos = await Alumno.findAll();
  res.status(200).json(alumnos.map(limpiarAlumno));
});
  
// POST /alumnos
router.post("/", async (req, res) => {
  if (!validarAlumno(req.body)) {
    return res.status(400).json({ error: "Campos inválidos" });
  }

  try {
    const nuevo = await Alumno.create({
      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      matricula: req.body.matricula,
      promedio: req.body.promedio,
      password: req.body.password,
      fotoPerfilUrl: null
    });

    res.status(201).json(limpiarAlumno(nuevo));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando alumno" });
  }
});


// GET /alumnos/:id
router.get("/:id", async (req, res) => {
  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

  res.status(200).json(limpiarAlumno(alumno));
});

// PUT /alumnos/:id
router.put("/:id", async (req, res) => {

  // Validación igual que POST
  if (!validarAlumno(req.body)) {
    return res.status(400).json({ error: "Campos inválidos" });
  }

  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) {
    return res.status(404).json({ error: "Alumno no encontrado" });
  }

  await alumno.update(req.body);
  res.status(200).json(alumno);
});

// DELETE /alumnos/:id
router.delete("/:id", async (req, res) => {
  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

  await alumno.destroy();
  res.status(200).json({});
});

// POST /alumnos/:id/fotoPerfil
router.post("/:id/fotoPerfil", upload.single("foto"), async (req, res) => {
  try {
    console.log("Params:", req.params);
    console.log("File:", req.file);
    console.log("S3 Bucket:", process.env.S3_BUCKET);

    const alumno = await Alumno.findByPk(req.params.id);
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    if (!req.file) return res.status(400).json({ error: "No se envió ninguna imagen" });

    const fileName = `alumnos/${alumno.id}_${Date.now()}.jpg`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: req.file.buffer,
      ACL: "public-read",
      ContentType: req.file.mimetype
    }));

    const url = `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;

    alumno.fotoPerfilUrl = url;
    await alumno.save();

    res.status(200).json({ fotoPerfilUrl: url });
  } catch (err) {
    console.error("ERROR uploading to S3:", err);
    res.status(500).json({ error: "Error subiendo la imagen a S3" });
  }
});

// POST /alumnos/:id/email
router.post("/:id/email", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const alumno = await Alumno.findByPk(id);

    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    const message = `Alumno: ${alumno.nombres} ${alumno.apellidos}\nPromedio: ${alumno.promedio}`;

    if (!SNS_TOPIC_ARN) {
      console.warn("SNS_TOPIC_ARN no definido, simulando envío");
      return res.status(200).json({ message: "Correo enviado (simulado)" });
    }

    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
    });

    const response = await snsClient.send(command);
    console.log("Mensaje SNS enviado:", response);

    res.status(200).json({ message: "Correo enviado vía SNS" });
  } catch (error) {
    console.error("Error enviando SNS:", error);
    res.status(500).json({ error: "Error al enviar correo" });
  }
});

// POST /alumnos/:id/session/login
router.post('/:id/session/login', async (req, res) => {
  try {
    const alumnoId = parseInt(req.params.id, 10);
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Password requerido' });

    const alumno = await Alumno.findByPk(alumnoId);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
    if (password !== alumno.password) return res.status(400).json({ error: 'Credenciales invalidas' });

    const sessionId = randomUUID();
    const sessionString = crypto.randomBytes(64).toString('hex');
    const fecha = Math.floor(Date.now() / 1000);

    const item = { 
      id: sessionId,
      fecha,
      alumnoId: Number(alumnoId),
      active: true,
      sessionString
    };

    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: item
    }));

    res.status(200).json({ sessionString });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Error creando session', details: err.message });
  }
});

// POST /alumnos/:id/session/verify
router.post('/:id/session/verify', async (req, res) => {
  try {
    const alumnoId = parseInt(req.params.id, 10);
    const { sessionString } = req.body;

    if (!sessionString) return res.status(400).json({ error: 'sessionString requerido' });

    const out = await docClient.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'alumnoId = :a AND sessionString = :s',
      ExpressionAttributeValues: { ':a': Number(alumnoId), ':s': sessionString }
    }));

    if (!out.Items || out.Items.length === 0) return res.status(400).json({ error: 'Sesion no encontrada' });

    const session = out.Items[0];

    if (session.active) res.status(200).json({ valid: true });
    else res.status(400).json({ error: 'Sesion no activa' });

  } catch (err) {
    console.error('VERIFY ERROR:', err);
    res.status(500).json({ error: 'Error verificando session', details: err.message });
  }
});

// POST /alumnos/:id/session/logout
router.post('/:id/session/logout', async (req, res) => {
  try {
    const alumnoId = parseInt(req.params.id, 10);
    const { sessionString } = req.body;

    if (!sessionString) return res.status(400).json({ error: 'sessionString requerido' });

    const out = await docClient.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'alumnoId = :a AND sessionString = :s',
      ExpressionAttributeValues: { ':a': Number(alumnoId), ':s': sessionString }
    }));

    if (!out.Items || out.Items.length === 0) return res.status(400).json({ error: 'Sesion no encontrada' });

    const session = out.Items[0];

    await docClient.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id: session.id },
      UpdateExpression: 'SET active = :f',
      ExpressionAttributeValues: { ':f': false }
    }));

    res.status(200).json({ ok: true });

  } catch (err) {
    console.error('LOGOUT ERROR:', err);
    res.status(500).json({ error: 'Error cerrando session', details: err.message });
  }
});

// Manejo de métodos no permitidos (405)
router.all(/.*/, (req, res) => {
  res.status(405).json({ error: "Método no permitido" });
});

module.exports = router;