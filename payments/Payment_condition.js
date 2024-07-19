const Sequelize = require('sequelize')
const connection = require('../database/database')
const Payment_Method = require('../payments/Payment_method')


const Payment_Condition = connection.define('Payment_Condition', {
   type_condition: {
    type: Sequelize.ENUM('Avista', 'Aprazo'),
    allowNull: false
   },
  amount_parcelable: {
    type: Sequelize.INTEGER,
    allowNull: true
  }

});

//1-1 user_id
Payment_Condition.belongsTo(Payment_Method, { foreignKey: 'payment_method_id', as: 'payment_method' });

//1-N
Payment_Method.hasMany(Payment_Condition, { foreignKey: 'payment_method_id', as: 'payment_condition' });


//Payment.sync({ force: false })
/*
(async () => {
  try {
    await Payment_Condition.sync({ force: true }); // Force: true will drop and recreate tables
    console.log('Tables payments_condition created successfully!');
  } catch (error) {
    console.error('Unable to create table payments_condition:', error);
  }
})();
*/

module.exports = Payment_Condition