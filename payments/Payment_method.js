const Sequelize = require('sequelize')
const connection = require('../database/database')
const Payment = require('../payments/Payment')

const type_payment = {
  BOLETO: 'Boleto',
  AVISTA: 'Avista', 
  DEPOSITO: 'Deposito', 
  PIX: 'Pix'
};

const Payment_Method = connection.define('Payment_Method', {
   payment_method: {
    type: Sequelize.ENUM(Object.values(type_payment)),
    allowNull: false
   },
  bank: {
    type: Sequelize.STRING,
    allowNull: true
  },
  agency: {
    type: Sequelize.STRING,
    allowNull: true
  },
  currency_account: {
    type: Sequelize.STRING,
    allowNull: true
  },
  cpf: {
    type: Sequelize.STRING,
    allowNull: true
  },
  cnpj: {
    type: Sequelize.STRING,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true
  }


});

//1-1 user_id
Payment_Method.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

//1-N
Payment.hasMany(Payment_Method, { foreignKey: 'payment_id', as: 'payment_method' });


//Payment.sync({ force: false })
/*
(async () => {
  try {
    await Payment_Method.sync({ force: true }); // Force: true will drop and recreate tables
    console.log('Tables payments_method created successfully!');
  } catch (error) {
    console.error('Unable to create table payments_method:', error);
  }
})()*/


module.exports = Payment_Method