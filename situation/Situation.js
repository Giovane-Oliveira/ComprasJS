const Sequelize = require("sequelize");
const connection = require("../database/database");


const Situation = connection.define("Situation", {
  situation: {
    type: Sequelize.STRING,
    allowNull: true,
  }
});

//Situation.sync({force: false})
/*
(async () => {
    try {
      await Situation.sync({ force: true }); // Force: true will drop and recreate tables
      console.log('Table Situations created successfully!');
    } catch (error) {
      console.error('Unable to create table Situations:', error);
    }
  })();
  */

module.exports = Situation;
