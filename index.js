const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const connection = require('./database/database');

const paymentsController = require('./payments/PaymentsController');
const purchasesController = require('./purchaseAndServices/PurchasesController');
const suppliersController = require('./suppliers/SuppliersController');
const usersController = require('./users/UsersController');
const session = require('express-session'); // Import express-session
const notificationUser = require('./middlewares/notification');

app.set('view engine', 'ejs');

app.use(express.static('public'));

// Sessions
app.use(session({
  secret: 'secret', //qualquer coisa além do secret
  cookie: {
      maxAge: 900000000 //ms   15min
  },
   resave: false,
   saveUninitialized: false
}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', notificationUser, (req, res) => {
    
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
app.use('/', usersController);
app.use('/', suppliersController);
app.use('/', paymentsController);
app.use('/', purchasesController);


// Model
const Sector = require('./users/Sector');
const Unit = require('./users/Unit');
const Employee = require('./employees/Employee');
const Profile = require('./users/Profile');
const User = require('./users/User');
const Permission = require('./users/Permission');
const Supplier = require('./suppliers/Supplier');
const Company = require('./companies/Company');
const Payment = require('./payments/Payment');
const Payment_Method = require('./payments/Payment_method');
const Purchase = require('./purchaseAndServices/Purchase')
const Item = require('./purchaseAndServices/Item');
const Movement = require('./movements/Movement');
const File = require('./users/File');
const Token = require('./users/Token');

app.listen(3000, () => {
    console.log('Server running on port 3000');
});