const Sequelize = require("sequelize");
//azure db admin daruma2024
const connection = new Sequelize("compras", "admin", "daruma2024", {
  host: "127.0.0.1",
  dialect: "mysql",
  timezone: "-03:00",
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci"
});

module.exports = connection;
