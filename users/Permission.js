const Sequelize = require('sequelize')
const connection = require('../database/database')
const Profile = require('./Profile')
const User = require('./User')


const Permission = connection.define('Permission', {
    open_request: { //abrir pedido
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    attach_nf: { // anexo documento fiscal
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    attach_doc: { //anexar documento
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    attach_charge: { //anexar cobrança
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    receipt_attachment: { //anexar recibo
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    commercial_authorization: {  //autorização comercial
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    financial_authorization: { //autorização financeira
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    validation: { //validação
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    closure: { //fechamento
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
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


module.exports = Permission