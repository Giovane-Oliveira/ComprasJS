const Sequelize = require('sequelize')
const connection = require('../database/database')
const Purchase = require('../purchaseAndServices/Purchase')
const Payment = require('../payments/Payment')
const Call = require('../calls/Call')
const User = require('../users/User')


const File = connection.define('File', {
   fileName: {
    type: Sequelize.TEXT,
    allowNull: false
  }

});

//1-1 user_id
File.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });

//1-N
Purchase.hasMany(File, { foreignKey: 'purchase_id', as: 'file' });

//1-1 user_id
File.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

//1-N
Payment.hasMany(File, { foreignKey: 'payment_id', as: 'file' });

//1-1 user_id
File.belongsTo(Call, { foreignKey: 'call_id', as: 'call' });

//1-N
Call.hasMany(File, { foreignKey: 'call_id', as: 'file' });

//1-1 user_id
File.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

//1-N
User.hasMany(File, { foreignKey: 'user_id', as: 'file' });

//File.sync({ force: false });
/*
(async () => {
  try {
    await File.sync({ force: true }); // Force: true will drop and recreate tables
    console.log('Table files created successfully!');
  } catch (error) {
    console.error('Unable to create table files:', error);
  }
})();
*/

module.exports = File