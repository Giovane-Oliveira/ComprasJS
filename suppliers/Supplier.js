const Sequelize = require('sequelize')
const connection = require('../database/database')

const Status = {
    ACTIVE: 1,
    INACTIVE: 0
}

const Supplier = connection.define('Supplier', {
    cnpj: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        default: Status.ACTIVE
    }
});


//Supplier.sync({force: true})


module.exports = Supplier