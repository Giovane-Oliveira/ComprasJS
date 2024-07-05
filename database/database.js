const Sequelize = require('sequelize');

const connection = new Sequelize('compras', 'root', '9138', {
  host: 'localhost',
  dialect: 'mysql',
  timezone: '-03:00'
});

  module.exports = connection;