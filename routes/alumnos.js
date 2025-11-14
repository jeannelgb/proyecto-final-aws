const express = require('express');
const router = express.Router();

let alumnos = [];

// Rechazo para métodos no soportados en /alumnos
router.all('/', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  next();
});

// GET /alumnos
router.get('/', (req, res) => {
  res.status(200).json(alumnos);
});

// Validación
function validarAlumno(body) {
  if (!body) return false;
  if (typeof body.id !== 'number' || body.id <= 0) return false;
  if (!body.nombres || typeof body.nombres !== 'string') return false;
  if (!body.apellidos || typeof body.apellidos !== 'string') return false;
  if (typeof body.matricula !== 'string' || body.matricula.length < 2) return false;
  if (typeof body.promedio !== 'number' || body.promedio < 0) return false;
  return true;
}

// POST /alumnos
router.post('/', (req, res) => {
  if (!validarAlumno(req.body)) {
    return res.status(400).json({ error: 'Campos inválidos' });
  }
  alumnos.push(req.body);
  return res.status(201).json(req.body);
});

// GET /alumnos/:id
router.get('/:id', (req, res) => {
  const alumno = alumnos.find(a => a.id == req.params.id);
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
  return res.status(200).json(alumno);
});

// PUT /alumnos/:id
router.put('/:id', (req, res) => {
  const idx = alumnos.findIndex(a => a.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Alumno no encontrado' });

  if (!validarAlumno(req.body)) {
    return res.status(400).json({ error: 'Campos inválidos' });
  }

  alumnos[idx] = req.body;
  return res.status(200).json(req.body);
});

// DELETE /alumnos/:id
router.delete('/:id', (req, res) => {
  const idx = alumnos.findIndex(a => a.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Alumno no encontrado' });

  alumnos.splice(idx, 1);
  return res.status(200).json({});
});

module.exports = router;