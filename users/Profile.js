const Sequelize = require('sequelize')
const connection = require('../database/database')


const Profile = connection.define('Profile', {
 
    description: {
        type: Sequelize.STRING,
        allowNull: false
    }

});


//Profile.sync({force : false})

/*(async () => {
    try {
      await Profile.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table profiles created successfully!');
    } catch (error) {
      console.error('Unable to create table profiles:', error);
    }
  })();*/

module.exports = Profile