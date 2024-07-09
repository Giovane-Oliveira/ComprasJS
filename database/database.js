const Sequelize = require('sequelize');

const connection = new Sequelize('compras', 'root', '9138', {
  host: 'localhost',
  dialect: 'mysql',
  timezone: '-03:00',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

  module.exports = connection;