const express = require('express');
const bodyParser = require('body-parser');
const alumnosRoutes = require('./routes/alumnos.js');
const profesoresRoutes = require('./routes/profesores.js');

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/alumnos', alumnosRoutes);
app.use('/profesores', profesoresRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API REST de Alumnos y Profesores funcionando correctamente.' });
});

// Gestion d’erreurs générales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Démarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Servidor en línea en http://localhost:${PORT}`));