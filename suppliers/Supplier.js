const Sequelize = require('sequelize')
const connection = require('../database/database')

const Status = {
    ACTIVE: 1,
    INACTIVE: 0
}

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
        allowNull: false,
        default: Status.ACTIVE
    }
});


//Supplier.sync({force: true})

// Synchronize models with the database
/*(async () => {
    try {
      await Supplier.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Tables suppliers created successfully!');
    } catch (error) {
      console.error('Unable to create table suppliers:', error);
    }
  })();*/

module.exports = Supplier