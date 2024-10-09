const Sequelize = require('sequelize')
const connection = require('../database/database')
const User = require('../users/User');
const Employee = require('../employees/Employee');


const Call = connection.define('Call', {

    active_mail: { 
        type: Sequelize.INTEGER,
        allowNull: false
      
    },
    departament: { 
        type: Sequelize.STRING,
        allowNull: true
      
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
        type: Sequelize.ENUM('AGUARDANDO ATENDIMENTO', 'EM ATENDIMENTO', 'FINALIZADO'),
        allowNull: false     
    },
    situation: { 
        type: Sequelize.ENUM('AGUARDANDO RESPOSTA DO SOLICITANTE', 'AGUARDANDO RESPOSTA DE TERCEIROS', 'FINALIZADO'),
        allowNull: true     
    },

    channel_service: { 
        type: Sequelize.ENUM('Whatsapp', 'E-mail', 'Teams', 'Chat 3CX', 'Comunicação Direta'),
        allowNull: true     
    }

});

//1-1 user_id
Call.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

//1-N
User.hasMany(Call, { foreignKey: 'user_id', as: 'call' });

//1-1 user_id
Call.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

//1-N
Employee.hasMany(Call, { foreignKey: 'employee_id', as: 'call' });

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