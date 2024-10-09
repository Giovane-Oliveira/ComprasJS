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
const Category = require('../category/Category');


router.get('/category',adminAuth, (req, res) => {

  var message = req.flash('message');

  console.log("Mensagem" + message);



    const departaments = [{name:'SAC', profile:'sac'}, {name:'T.I', profile:'ti'}, {name:'RH', profile:'rh'},
        {name:'FINANCEIRO', profile:'financial'}, {name:'MARKETING', profile:'marketing'}, {name:'COMPRAS', profile:'purchases'}    
     ];

     Category.findAll().then(categories => {

      res.render('call/categories', { user: req.session.user, departaments: departaments, categories: categories, message: message });

     }).catch(err => console.log(err));    

});

router.post('/create/category', adminAuth, (req, res) => {
  const departament = req.body.departament;
  const description = req.body.describe;

  console.log("Despartamento" + departament);
  console.log("Descrição" + description);

  // Use await to wait for the promise to resolve
 Profile.findOne({
    where: {
      description: departament
    }
  }).then(findProfile => {

    if (findProfile) { // Check if a profile was found
      console.log("Profile ID" + findProfile.id);
  
      Category.create({
        departament: departament,
        description: description.toUpperCase(),
        profile_id: findProfile.id
      }).catch(err => console.log(err));
    } else {
      console.error("Profile not found for department:", departament);
      // Handle the case where the profile is not found (e.g., redirect with an error message)
    }

  }).catch(err => console.log(err));

  req.flash('message', 'Categoria criada com sucesso!')
  
 // After creating the category, wait for 2 seconds before redirecting
 setTimeout(() => {
  res.redirect('/category');
}, 2000); // 2000 milliseconds = 2 seconds
});


router.get('/delete/category/:id', adminAuth, async (req, res) => {

const id = req.params.id;

Category.destroy({
    where: {
      id: id
    }
  });

  req.flash('message', 'Categoria deletada com sucesso!')
  
   // After creating the category, wait for 2 seconds before redirecting
 setTimeout(() => {
  res.redirect('/category');
}, 2000); // 2000 milliseconds = 2 seconds

});




module.exports = router;