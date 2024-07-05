const Sequelize = require('sequelize')
const connection = require('../database/database')
const Profile = require('./Profile')
const Employee = require('../employees/Employee')



const User = connection.define('User', {
    login: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    active: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
});

/*
//1-1 user_id
Compra.belongsTo(Usuario, { foreignKey: 'user_id', as: 'usuario' });

//1-N
Usuario.hasMany(Compra, { foreignKey: 'user_id', as: 'compra' });*/

//1-1 user_id
User.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile' });

//1-N
Profile.hasMany(User, { foreignKey: 'profile_id', as: 'user' });

//1-1 user_id
User.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

//1-N
Employee.hasMany(User, { foreignKey: 'employee_id', as: 'user' });

//User.sync({force: false})


module.exports = User