const Sequelize = require('sequelize')
const connection = require('../database/database')
const Call = require('../calls/Call')

const Message = connection.define('Message', {

    sender_id: { 
        type: Sequelize.INTEGER,
        allowNull: true    
    },
    attendant_id: { 
        type: Sequelize.INTEGER,
        allowNull: true    
    },
    message: { 
        type: Sequelize.STRING,
        allowNull: false    
    }
});

//1-1 user_id
Message.belongsTo(Call, { foreignKey: 'call_id', as: 'call' });

//1-N
Call.hasMany(Message, { foreignKey: 'call_id', as: 'message' });

//Message.sync({force: false})
/*
(async () => {
    try {
      await Message.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table messages created successfully!');
    } catch (error) {
      console.error('Unable to create table messages:', error);
    }
  })();
  */

  module.exports = Call