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
const Situation = require( '../situation/Situation');



router.get('/situations',adminAuth, (req, res) => {

  var message = req.flash('message');

  console.log("Mensagem" + message);

     Situation.findAll().then(situation => {

      res.render('call/situations', { user: req.session.user, message: message, situations: situation });

     }).catch(err => console.log(err));    

});

router.post('/create/situation', adminAuth, (req, res) => {
  
    const situation = req.body.situation;

    Situation.create(
      {
        situation: situation
        
      });

  req.flash('message', 'Situação criada com sucesso!')
  
 // After creating the category, wait for 2 seconds before redirecting
 setTimeout(() => {
  res.redirect('/situations');
}, 2000); // 2000 milliseconds = 2 seconds
});


router.get('/delete/situation/:id', adminAuth, async (req, res) => {

const id = req.params.id;

Situation.destroy({
    where: {
      id: id
    }
  });

  req.flash('message', 'Situação deletada com sucesso!')
  
   // After creating the category, wait for 2 seconds before redirecting
 setTimeout(() => {
  res.redirect('/situations');
}, 2000); // 2000 milliseconds = 2 seconds

});




module.exports = router;