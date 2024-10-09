const Sequelize = require('sequelize')
const connection = require('../database/database')
const Profile = require('./Profile')
const User = require('./User')


const Permission = connection.define('Permission', {
  user_registration: { //cadastro de usuário
    type: Sequelize.INTEGER,
    allowNull: false,
    default: 0
  },
  supplier_registration: { //cadastro de fornecedor
    type: Sequelize.INTEGER,
    allowNull: false,
    default: 0
  },
  create_call: { //cadastro de fornecedor
    type: Sequelize.INTEGER,
    allowNull: false,
    default: 0
  },
  create_category: { //cadastro de fornecedor
    type: Sequelize.INTEGER,
    allowNull: false,
    default: 0
  },
  answer_call: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  type_cause: {
    type: Sequelize.INTEGER,
    allowNull: true
  }
});

/*
//1-1 user_id
Compra.belongsTo(Usuario, { foreignKey: 'user_id', as: 'usuario' });

//1-N
Usuario.hasMany(Compra, { foreignKey: 'user_id', as: 'compra' });*/

//1-1 user_id
Permission.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile' });

//1-N
Profile.hasMany(Permission, { foreignKey: 'profile_id', as: 'permission' });

//1-1 user_id
Permission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

//1-N
User.hasMany(Permission, { foreignKey: 'user_id', as: 'permission' });


//Permission.sync({force: false})

/*
(async () => {
    try {
      await Permission.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table permissions created successfully!');
    } catch (error) {
      console.error('Unable to create table permissions:', error);
    }
  })();*/


module.exports = Permission