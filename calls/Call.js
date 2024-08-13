const Sequelize = require('sequelize')
const connection = require('../database/database')
const User = require('../users/User')

const Call = connection.define('Call', {

    active_mail: { 
        type: Sequelize.INTEGER,
        allowNull: false
      
    },
    category: { 
        type: Sequelize.STRING,
        allowNull: true
      
    },
    subject: { 
        type: Sequelize.STRING,
        allowNull: false
   
    },
    priority: { 
        type: Sequelize.STRING,
        allowNull: false     
    },
    attendant_id: { 
        type: Sequelize.INTEGER,
        allowNull: true     
    },
    status: { 
        type: Sequelize.ENUM('PENDENTE', 'EM ATENDIMENTO', 'FINALIZADO'),
        allowNull: false     
    }
});

//1-1 user_id
Call.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

//1-N
User.hasMany(Call, { foreignKey: 'user_id', as: 'call' });

//Call.sync({force: false})
/*
(async () => {
    try {
      await Call.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table calls created successfully!');
    } catch (error) {
      console.error('Unable to create table calls:', error);
    }
  })();
  */

  module.exports = Call