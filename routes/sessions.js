const express = require('express');
const router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Alumno = require('../models/Alumno');

require('dotenv').config();

const REGION = process.env.AWS_REGION;
const TABLE = process.env.DYNAMO_TABLE_SESIONES || 'sesiones-alumnos';

const ddb = new DynamoDBClient({ region: REGION, credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN
}});
const docClient = DynamoDBDocumentClient.from(ddb);

// Helper: generate 128 hex digits => 64 bytes -> hex = 128 chars
function genSessionString() {
  return crypto.randomBytes(64).toString('hex');
}

// POST /alumnos/:id/session/login
router.post('/:id/session/login', async (req, res) => {
  try {
    const alumnoId = parseInt(req.params.id, 10);
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password requerido' });

    const alumno = await Alumno.findByPk(alumnoId);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

    const match = await bcrypt.compare(password, alumno.password);
    if (!match) return res.status(400).json({ error: 'Credenciales invalidas' });

    const sessionId = uuidv4();
    const sessionString = genSessionString();
    const fecha = Math.floor(Date.now() / 1000);

    const item = {
      id: sessionId,               // PK
      fecha,
      alumnoId,
      active: true,
      sessionString
    };

    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: item
    }));

    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando session' });
  }
});

// POST /alumnos/:id/session/verify
router.post('/:id/session/verify', async (req, res) => {
  try {
    const { sessionString } = req.body;
    if (!sessionString) return res.status(400).json({ error: 'sessionString requerido' });

    // Requirement: we must find the session by sessionString. We assume a GSI exists on sessionString.
    // Query using index "sessionString-index"
    const q = {
      TableName: TABLE,
      IndexName: 'sessionString-index',
      KeyConditionExpression: 'sessionString = :s',
      ExpressionAttributeValues: { ':s': sessionString }
    };

    const out = await docClient.send(new QueryCommand(q));
    if (!out.Items || out.Items.length === 0) return res.status(400).json({ error: 'Sesion no encontrada' });

    const session = out.Items[0];
    if (session.active === true) return res.status(200).json({ valid: true });
    else return res.status(400).json({ error: 'Sesion no activa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error verificando session' });
  }
});

// POST /alumnos/:id/session/logout
router.post('/:id/session/logout', async (req, res) => {
  try {
    const { sessionString } = req.body;
    if (!sessionString) return res.status(400).json({ error: 'sessionString requerido' });

    // Query by sessionString to get PK id
    const q = {
      TableName: TABLE,
      IndexName: 'sessionString-index',
      KeyConditionExpression: 'sessionString = :s',
      ExpressionAttributeValues: { ':s': sessionString }
    };

    const out = await docClient.send(new QueryCommand(q));
    if (!out.Items || out.Items.length === 0) return res.status(400).json({ error: 'Sesion no encontrada' });

    const session = out.Items[0];

    // Update active=false
    await docClient.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id: session.id },
      UpdateExpression: 'SET active = :f',
      ExpressionAttributeValues: { ':f': false }
    }));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cerrando session' });
  }
});

module.exports = router;