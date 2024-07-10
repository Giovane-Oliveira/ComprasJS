const Sequelize = require('sequelize')
const connection = require('../database/database')
const Unit = require('../users/Unit')
const Sector = require('../users/Sector')

const Employee = connection.define('Employee', {
    cpf: { 
        type: Sequelize.STRING,
        allowNull: false
      
    },
    name: { 
        type: Sequelize.STRING,
        allowNull: false
   
    },
    email: { 
        type: Sequelize.STRING,
        allowNull: false     
    }
});


/*
//1-1 user_id
Compra.belongsTo(Usuario, { foreignKey: 'user_id', as: 'usuario' });

//1-N
Usuario.hasMany(Compra, { foreignKey: 'user_id', as: 'compra' });*/

//1-1 user_id
Employee.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

//1-N
Unit.hasMany(Employee, { foreignKey: 'unit_id', as: 'employee' });

//1-1 user_id
Employee.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });

//1-N
Sector.hasMany(Employee, { foreignKey: 'sector_id', as: 'employee' });


//Employee.sync({force: false})
/*
(async () => {
    try {
      await Employee.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Tables employees created successfully!');
    } catch (error) {
      console.error('Unable to create table employees:', error);
    }
  })();*/


module.exports = Employee