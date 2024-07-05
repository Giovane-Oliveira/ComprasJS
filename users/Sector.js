const Sequelize = require('sequelize')
const connection = require('../database/database')


const Sector = connection.define('Sector', {
 
    description: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

//Sector.sync({force : false})

module.exports = Sector