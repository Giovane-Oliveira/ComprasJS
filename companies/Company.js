const Sequelize = require('sequelize')
const connection = require('../database/database')


const Company = connection.define('Company', {
    cnpj: { 
        type: Sequelize.STRING,
        allowNull: false
      
    },
    name: { 
        type: Sequelize.STRING,
        allowNull: false
   
    }
});

//Employee.sync({force: false})
/*
(async () => {
    try {
      await Company.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Tables company created successfully!');
    } catch (error) {
      console.error('Unable to create table company:', error); 
    }
  })();
*/
module.exports = Company