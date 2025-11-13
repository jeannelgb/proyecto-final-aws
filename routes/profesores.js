const express = require('express');
const router = express.Router();
const { validateProfesor } = require('../validators/profesoresValidator');

let profesores = [];
let nextId = 1;

// GET /profesores
router.get('/', (req, res) => {
  res.status(200).json(profesores);
});

// GET /profesores/:id
router.get('/:id', (req, res) => {
  const profesor = profesores.find(p => p.id === parseInt(req.params.id));
  if (!profesor) return res.status(404).json({ error: 'Profesor no encontrado.' });
  res.status(200).json(profesor);
});

// POST /profesores
router.post('/', (req, res) => {
  const { valid, message } = validateProfesor(req.body);
  if (!valid) return res.status(400).json({ error: message });

  const nuevo = { id: nextId++, ...req.body };
  profesores.push(nuevo);
  res.status(201).json(nuevo);
});

// PUT /profesores/:id
router.put('/:id', (req, res) => {
  const profesor = profesores.find(p => p.id === parseInt(req.params.id));
  if (!profesor) return res.status(404).json({ error: 'Profesor no encontrado.' });

  const { valid, message } = validateProfesor(req.body);
  if (!valid) return res.status(400).json({ error: message });

  Object.assign(profesor, req.body);
  res.status(200).json(profesor);
});

// DELETE /profesores/:id
router.delete('/:id', (req, res) => {
  const index = profesores.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Profesor no encontrado.' });

  profesores.splice(index, 1);
  res.status(200).json({ message: 'Profesor eliminado correctamente.' });
});

module.exports = router;