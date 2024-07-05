const Sequelize = require('sequelize')
const connection = require('../database/database')
const Employee = require('../employees/Employee')
const Supplier = require('../suppliers/Supplier')

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

const Purchase = connection.define('Purchase', {
   justification: {
    type: Sequelize.TEXT,
    allowNull: false
   },
  item: {
    type: Sequelize.STRING,
    allowNull: true
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true
  },
  amount:{
    type: Sequelize.INTEGER,
    allowNull: false
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false
  },
 total: {
    type: Sequelize.FLOAT,
    allowNull: false
  },

  status: {
    type: Sequelize.ENUM(Object.values(Status)), // Use Sequelize.ENUM
    allowNull: false,
    defaultValue: Status.GESTOR // Set a default status
  },

});

//1-1 user_id
Purchase.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

//1-N
Employee.hasMany(Purchase, { foreignKey: 'employee_id', as: 'purchase' });

//1-1 user_id
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

//1-N
Supplier.hasMany(Purchase, { foreignKey: 'supplier_id', as: 'purchase' });


//Purchase.sync({ force: false })


module.exports = Purchase