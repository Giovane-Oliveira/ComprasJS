const Sequelize = require('sequelize')
const connection = require('../database/database')
const User = require('../users/User')

const Call = connection.define('Call', {
    category: { 
        type: Sequelize.STRING,
        allowNull: false
      
    },
    subject: { 
        type: Sequelize.STRING,
        allowNull: false
   
    },
    priority: { 
        type: Sequelize.STRING,
        allowNull: false     
    },
    attendant: { 
        type: Sequelize.STRING,
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