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

module.exports = Unit