const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const fs = require('fs-extra'); // Import fs for file operations
const Payment = require('../payments/Payment');
const { where } = require('sequelize');
const { Op } = require('sequelize');
const Supplier = require('../suppliers/Supplier');
const Company = require('../companies/Company');
const Payment_Method = require('../payments/Payment_method');
const File = require('../users/File');
const Employee = require('../employees/Employee');
const Sector = require('../users/Sector');
const Unit = require('../users/Unit');
const nodemailer = require('nodemailer');
const Profile = require('../users/Profile');
const User = require('../users/User');
const adminAuth = require('../middlewares/adminAuth');
const Payment_Condition = require('../payments/Payment_condition')
const Movement = require('../movements/Movement');
const pug = require('pug');

router.get('/call/dashboard',adminAuth, async (req, res) => {

res.render('call/dashboard', { user: req.session.user });

});

router.get('/call/create',adminAuth, async (req, res) => {

    const departaments = [{name:'SAC', profile:'sac'}, {name:'T.I', profile:'ti'}, {name:'RH', profile:'rh'},
        {name:'FINANCEIRO', profile:'financial'}, {name:'MARKETING', profile:'marketing'}, {name:'COMPRAS', profile:'purchases'}    
     ]

    res.render('call/create', { user: req.session.user, departaments: departaments });

});

router.get('/call/show',adminAuth, async (req, res) => {


    res.render('call/show', { user: req.session.user });

});



module.exports = router;