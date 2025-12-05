require('dotenv').config();
const express = require('express');
const sequelize = require('./db');
const bodyParser = require('body-parser');
const alumnosRoutes = require('./routes/alumnos.js');
const profesoresRoutes = require('./routes/profesores.js');
const sessionsRoutes = require('./routes/sessions.js');

console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  name: process.env.DB_NAME
});

const app = express();
app.use(bodyParser.json());

// Rutas
app.use('/alumnos', alumnosRoutes);
app.use('/profesores', profesoresRoutes);
app.use('/alumnos', sessionsRoutes);

// Ruta de validación
app.get('/', (req, res) => {
  res.json({ message: 'API REST de Alumnos y Profesores funcionando correctamente.' });
});

// Gestión de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Inicio
const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  console.log("Base de datos sincronizada");
  app.listen(PORT, "0.0.0.0", () => console.log(`✅ Servidor en línea en http://localhost:${PORT}`));
});