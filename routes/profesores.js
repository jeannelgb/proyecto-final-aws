const express = require('express');
const router = express.Router();

// Base de datos en memoria
let profesores = {};

// Rechazo para métodos no soportados en /alumnos
router.all('/', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  next();
});

// Validación
function validarProfesor(body) {
    if (!body) return false;
    if (typeof body.id !== "number" || body.id <= 0) return false;
    if (typeof body.nombres !== "string" || body.nombres.trim() === "") return false;
    if (typeof body.apellidos !== "string" || body.apellidos.trim() === "") return false;
    if (typeof body.numeroEmpleado !== "number" || body.numeroEmpleado <= 0) return false;
    if (typeof body.horasClase !== "number" || body.horasClase < 0 || !Number.isInteger(body.horasClase)) return false;
    return true;
}

// GET /profesores
router.get('/', (req, res) => {
    res.status(200).json(Object.values(profesores));
});

// POST /profesores
router.post('/', (req, res) => {
    const profesor = req.body;

    if (!validarProfesor(profesor)) {
        return res.status(400).json({ error: "Campos inválidos" });
    }

    profesores[profesor.id] = profesor;
    res.status(201).json(profesor);
});

// GET /profesores/:id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (!profesores[id]) {
        return res.status(404).json({ error: "Profesor no encontrado" });
    }

    res.status(200).json(profesores[id]);
});

// PUT /profesores/:id
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (!profesores[id]) {
        return res.status(404).json({ error: "Profesor no encontrado" });
    }

    if (!validarProfesor(req.body)) {
        return res.status(400).json({ error: "Campos inválidos" });
    }

    profesores[id] = req.body;
    res.status(200).json(req.body);
});

// DELETE /profesores/:id
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (!profesores[id]) {
        return res.status(404).json({ error: "Profesor no encontrado" });
    }

    delete profesores[id];
    res.status(200).json({ message: "Profesor eliminado" });
});

// DELETE /profesores  → 405 Method Not Allowed
router.delete('/', (req, res) => {
    res.status(405).json({ error: "Método no permitido" });
});

module.exports = router;