const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Alumno = sequelize.define('Alumno', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombres: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false
  },
  matricula: {
    type: DataTypes.STRING,
    allowNull: false
  },
  promedio: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fotoPerfilUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Alumno;