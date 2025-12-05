const { Sequelize } = require('sequelize');

// Base de données SQLite locale
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

module.exports = sequelize;