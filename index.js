const express = require('express');
const session = require('express-session');
const Redis = require('ioredis');
const connectRedis = require('connect-redis');
const app = express();
const connection = require('./database/database');
const cookieParser = require("cookie-parser");
var flash = require("express-flash");

// Controllers
const paymentsController = require('./payments/PaymentsController');
const purchasesController = require('./purchaseAndServices/PurchasesController');
const suppliersController = require('./suppliers/SuppliersController');
const usersController = require('./users/UsersController');

// Redis setup

const redisClient = new Redis({
    host: '127.0.0.1', // Or your Redis server's IP address
    port: 6379 // Or the port Redis is running on
  });
const RedisStore = connectRedis(session);
const sessionStore = new RedisStore({ client: redisClient });

// View engine setup
app.set('view engine', 'ejs');

app.use(cookieParser("jsaddsh"));

// Static files
app.use(express.static('public', {
    maxAge: '1d' // Cache static files for one day
}));

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'default_secret',
    cookie: {
        maxAge: 15 * 60 * 1000, // 15 minutes
        httpOnly: true,
        secure: false  //process.env.NODE_ENV === 'production'
    },
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Routes
app.get('/', (req, res) => {

    var success = req.flash('success');
    var error = req.flash('error');
    var message = '';

    success = (success == undefined || success.length == 0) ? '' : success;
    error = (error == undefined || error.length == 0) ? '' : error;

if(success != ''){

    message = success;

}else if(error != ''){

    message = error;
}

    if(req.session.user != undefined){

        res.redirect('/dashboard')

    }else{
        res.render('users/login.ejs', {message: message});
    }
   
});

app.use('/', usersController);
app.use('/', suppliersController);
app.use('/', paymentsController);
app.use('/', purchasesController);

// Database connection
connection
    .authenticate()
    .then(() => console.log('Database connection established successfully.'))
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1); // Exit process if database connection fails
    });

// Models
const models = {
    Sector: require('./users/Sector'),
    Unit: require('./users/Unit'),
    Employee: require('./employees/Employee'),
    Profile: require('./users/Profile'),
    User: require('./users/User'),
    Permission: require('./users/Permission'),
    Supplier: require('./suppliers/Supplier'),
    Company: require('./companies/Company'),
    Payment: require('./payments/Payment'),
    Payment_Method: require('./payments/Payment_method'),
    Purchase: require('./purchaseAndServices/Purchase'),
    Item: require('./purchaseAndServices/Item'),
    Movement: require('./movements/Movement'),
    File: require('./users/File'),
    Token: require('./users/Token'),
    Payment_Condition: require('./payments/Payment_condition')
};



// Server setup
app.listen(3001, () => console.log('Server running on port 3001'));
