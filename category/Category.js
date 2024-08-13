const Sequelize = require('sequelize')
const connection = require('../database/database')
const Profile = require('../users/Profile')

const Category = connection.define('Category', {
  departament: {
    type: Sequelize.STRING,
    allowNull: false

  },
  description: {
    type: Sequelize.STRING,
    allowNull: false

  }

});

//1-1 user_id
Category.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile' });

//1-N
Profile.hasMany(Category, { foreignKey: 'profile_id', as: 'category' });

//Category.sync({force: false})
/*
(async () => {
    try {
      await Category.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table categories created successfully!');
    } catch (error) {
      console.error('Unable to create table calls:', error);
    }
  })();
  */

module.exports = Category