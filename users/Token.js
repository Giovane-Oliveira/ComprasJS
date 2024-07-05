const Sequelize = require('sequelize')
const connection = require('../database/database')


const Token = connection.define('Token', {
 
    managers: { //gerentes
        type: Sequelize.STRING(5),
        allowNull: false
    },
    leaders: { //Gestores
        type: Sequelize.STRING(6),
        allowNull: false
    },
    directors: { // Diretores
        type: Sequelize.STRING(7),
        allowNull: false
    },
    purchases: { // Compras
        type: Sequelize.STRING(8),
        allowNull: false
    },
    financial: { // Financeiro
        type: Sequelize.STRING(9),
        allowNull: false
    },
    
});

//Token.sync({force : false})

module.exports = Token