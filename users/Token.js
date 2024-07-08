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
        allowNull: TransformStreamDefaultController
    },
    financial: { // Financeiro
        type: Sequelize.STRING(9),
        allowNull: true
    },
    ti: { // T.I
        type: Sequelize.STRING(10),
        allowNull: true
    }
    
});

//Token.sync({force : false})

/*(async () => {
    try {
      await Token.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table tokens created successfully!');
    } catch (error) {
      console.error('Unable to create table tokens:', error);
    }
  })();*/

module.exports = Token