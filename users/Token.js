const Sequelize = require('sequelize')
const connection = require('../database/database')


const Token = connection.define('Token', {
 
    managers: { //gerentes
        type: Sequelize.STRING(5),
        allowNull: true
    },
    leaders: { //Gestores
        type: Sequelize.STRING(6),
        allowNull: true
    },
    directors: { // Diretores
        type: Sequelize.STRING(7),
        allowNull: true
    },
    purchases: { // Compras
        type: Sequelize.STRING(8),
        allowNull: true
    },
    financial: { // Financeiro
        type: Sequelize.STRING(9),
        allowNull: true
    },
    ti: { 
        type: Sequelize.STRING(10),
        allowNull: true
    },
    marketing: { 
        type: Sequelize.STRING(11),
        allowNull: true
    },
    sau: { 
        type: Sequelize.STRING(12),
        allowNull: true
    },
    sac: { 
        type: Sequelize.STRING(13),
        allowNull: true
    },
    rh: { 
        type: Sequelize.STRING(14),
        allowNull: true
    }
    
});

//Token.sync({force : false})
/*
(async () => {
    try {
      await Token.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table tokens created successfully!');
    } catch (error) {
      console.error('Unable to create table tokens:', error);
    }
  })();
*/
module.exports = Token