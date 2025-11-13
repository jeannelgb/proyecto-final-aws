const express = require('express');
const router = express.Router();
const { validateAlumno } = require('../validators/alumnosValidator');

let alumnos = [];
let nextId = 1;

// GET /alumnos
router.get('/', (req, res) => {
  res.status(200).json(alumnos);
});

// GET /alumnos/:id
router.get('/:id', (req, res) => {
  const alumno = alumnos.find(a => a.id === parseInt(req.params.id));
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
  res.status(200).json(alumno);
});

// POST /alumnos
router.post('/', (req, res) => {
  const { valid, message } = validateAlumno(req.body);
  if (!valid) return res.status(400).json({ error: message });

  const nuevo = { id: nextId++, ...req.body };
  alumnos.push(nuevo);
  res.status(201).json(nuevo);
});

// PUT /alumnos/:id
router.put('/:id', (req, res) => {
  const alumno = alumnos.find(a => a.id === parseInt(req.params.id));
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

  const { valid, message } = validateAlumno(req.body);
  if (!valid) return res.status(400).json({ error: message });

  Object.assign(alumno, req.body);
  res.status(200).json(alumno);
});

// DELETE /alumnos/:id
router.delete('/:id', (req, res) => {
  const index = alumnos.findIndex(a => a.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Alumno no encontrado.' });

  alumnos.splice(index, 1);
  res.status(200).json({ message: 'Alumno eliminado correctamente.' });
});

module.exports = router;