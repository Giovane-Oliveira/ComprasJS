const Sequelize = require('sequelize')
const connection = require('../database/database')


const Sector = connection.define('Sector', {
 
    description: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

//Sector.sync({force : false})
/*
(async () => {
    try {
      await Sector.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table profiles created successfully!');
    } catch (error) {
      console.error('Unable to create table profiles:', error);
    }
  })();*/

module.exports = Sector