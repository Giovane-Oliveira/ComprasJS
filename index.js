const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const connection = require('./database/database');

const paymentsController = require('./payments/PaymentsController');
const purchasesController = require('./purchaseAndServices/PurchasesController');
const suppliersController = require('./suppliers/SuppliersController');
const usersController = require('./users/UsersController');

app.set('view engine', 'ejs');

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    if (req.query.success) {
        // Render the index page with a success message
        res.render('users/login.ejs', { message: 'Registro efetuado com sucesso' });
      } else if (req.query.error) {
        // Render the index page with an error message
        res.render('users/login.ejs', { message: 'Este email já está registrado ou link inválido!' });
      } else {
        // Render the index page without a message
        res.render('users/login.ejs', { message: '' });
      }
});

connection
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });


//Controller
app.use('/', suppliersController);
app.use('/', paymentsController);
app.use('/', purchasesController);
app.use('/', usersController);

// Model
const Sector = require('./users/Sector');
const Unit = require('./users/Unit');
const Employee = require('./employees/Employee');
const Profile = require('./users/Profile');
const User = require('./users/User');
const Permission = require('./users/Permission');
//const Purchase = require('./purchaseAndServices/Purchase')
const Token = require('./users/Token');
//const Supplier = require('./suppliers/Supplier');
//const Payment = require('./payments/Payment');
//const Movement = require('./movements/Movement');
//const File = require('./users/File');

app.listen(3000, () => {
    console.log('Server running on port 3000');
});