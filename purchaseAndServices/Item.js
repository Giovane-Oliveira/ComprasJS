const Sequelize = require('sequelize')
const connection = require('../database/database')
const Purchase = require('../purchaseAndServices/Purchase')


const Item = connection.define('Item', {

  item: {
    type: Sequelize.TEXT,
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
  }
});

//1-1 user_id
Item.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });

//1-N
Purchase.hasMany(Item, { foreignKey: 'purchase_id', as: 'item' });


//Purchase.sync({ force: false })

// Synchronize models with the database
/*
(async () => {
  try {
    await Item.sync({ force: true }); // Force: true will drop and recreate tables
    console.log('Table items created successfully!');
  } catch (error) {
    console.error('Unable to create table items:', error);
  }
})();*/


module.exports = Item;