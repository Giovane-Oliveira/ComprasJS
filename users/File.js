const Sequelize = require('sequelize')
const connection = require('../database/database')
const Purchase = require('../purchaseAndServices/Purchase')
const Payment = require('../payments/Payment')


const File = connection.define('File', {
   path: {
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


//File.sync({ force: false });




module.exports = File