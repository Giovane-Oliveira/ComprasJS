const Sequelize = require("sequelize");
const connection = require("../database/database");
const Profile = require("../users/Profile");

const Type = connection.define("Type", {
  type: {
    type: Sequelize.TEXT,
    allowNull: true,
  }
});

//1-1 user_id
Type.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile' });

//1-N
Profile.hasMany(Type, { foreignKey: 'profile_id', as: 'type' });

//Type.sync({force: false})
/*
(async () => {
    try {
      await Type.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table Types created successfully!');
    } catch (error) {
      console.error('Unable to create table Types:', error);
    }
  })();
  */

module.exports = Type;
