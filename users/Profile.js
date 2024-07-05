const Sequelize = require('sequelize')
const connection = require('../database/database')


const Profile = connection.define('Profile', {
 
    description: {
        type: Sequelize.STRING,
        allowNull: false
    }

});


//Profile.sync({force : false})

module.exports = Profile