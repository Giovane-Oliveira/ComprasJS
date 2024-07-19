const Sequelize = require('sequelize')
const connection = require('../database/database')
const Employee = require('../employees/Employee')
const Payment = require('../payments/Payment')
const Purchases = require('../purchaseAndServices/Purchase')


// Define the status enum values
const Status = {
    GESTOR: 'Em análise pelo gestor',
    DIRETOR: 'Em análise pelo diretor', 
    COMPRAS: 'Em análise pelo compras', // ANEXAR BOLETO
    FINANCEIRO: 'Pagamento em andamento', // REALIZA PAGAMENTO E ANEXA O COMPROVANTE
    REPROVADO: 'REPROVADO',
    CANCELADO: 'CANCELADO',
    FINALIZADO: 'APROVADO'
    // Add more status values as needed
  };

const Movement = connection.define('Movement', {

  leader_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  director_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  purchase_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  financial_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM(Object.values(Status)), // Use Sequelize.ENUM
    allowNull: false,
    defaultValue: Status.GESTOR // Set a default status
  }
});

//1-1 user_id
Movement.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

//1-N
Employee.hasMany(Movement, { foreignKey: 'employee_id', as: 'movement' });

//1-1 user_id
Movement.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

//1-N
Payment.hasMany(Movement, { foreignKey: 'payment_id', as: 'movement' });

//1-1 user_id
Movement.belongsTo(Purchases, { foreignKey: 'purchases_id', as: 'purchases' });

//1-N
Purchases.hasMany(Movement, { foreignKey: 'purchases_id', as: 'movement' });


//Movement.sync({ force: false })
/*
(async () => {
  try {
    await Movement.sync({ force: true }); // Force: true will drop and recreate tables
    console.log('Table movements created successfully!');
  } catch (error) {
    console.error('Unable to create table movements:', error);
  }
})();
*/


module.exports = Movement