const Sequelize = require('sequelize')
const connection = require('../database/database')
const Sector = require('./Sector')


const Unit = connection.define('Unit', {
 
    description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    address:{
        type: Sequelize.STRING,
        allowNull: false
    },
    city:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cep:{
        type: Sequelize.STRING,
        allowNull: false
    },
    phone:{
        type: Sequelize.STRING,
        allowNull: false
    }
});


Unit.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });

Sector.hasMany(Unit, { foreignKey: 'sector_id', as: 'unit' });


//Unit.sync({force : false})

/*(async () => {
    try {
      await Unit.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table units created successfully!');
    } catch (error) {
      console.error('Unable to create table units:', error);
    }
  })();*/

module.exports = Unit