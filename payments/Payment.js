const Sequelize = require('sequelize')
const connection = require('../database/database')
const Employee = require('../employees/Employee')
const Supplier = require('../suppliers/Supplier')
const Company = require('../companies/Company')


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

const Payment = connection.define('Payment', {

  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false
  },
  expiration_date: {
    type: Sequelize.DATE,
    allowNull: false
  },
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
Payment.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

//1-N
Employee.hasMany(Payment, { foreignKey: 'employee_id', as: 'payment' });

//1-1 user_id
Payment.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

//1-N
Supplier.hasMany(Payment, { foreignKey: 'supplier_id', as: 'payment' });

//1-1 user_id
Payment.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

//1-N
Company.hasMany(Payment, { foreignKey: 'company_id', as: 'payment' });

//Payment.sync({ force: false })
/*
(async () => {
  try {
    await Payment.sync({ force: true }); // Force: true will drop and recreate tables
    console.log('Tables payments created successfully!');
  } catch (error) {
    console.error('Unable to create table payments:', error);
  }
})();*/


module.exports = Payment