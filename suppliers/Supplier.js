const Sequelize = require('sequelize')
const connection = require('../database/database')

const Supplier = connection.define('Supplier', {
    cnpj: {
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        default: 1
    }
});


//Supplier.sync({force: true})

// Synchronize models with the database
/*
(async () => {
    try {
      await Supplier.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Tables suppliers created successfully!');
    } catch (error) {
      console.error('Unable to create table suppliers:', error);
    }
  })();*/

module.exports = Supplier