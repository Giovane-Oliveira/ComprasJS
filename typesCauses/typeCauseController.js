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
const Type = require('../typesCauses/Type');
const Category = require('../category/Category');

router.get('/typesCauses',adminAuth, (req, res) => {
  var message = req.flash('message');

  const departaments = [{name:'SAC', profile:'sac'}, {name:'T.I', profile:'ti'}, {name:'RH', profile:'rh'},
    {name:'FINANCEIRO', profile:'financial'}, {name:'MARKETING', profile:'marketing'}, {name:'COMPRAS', profile:'purchases'}    
 ];

  Type.findAll().then(types => {

    res.render('call/type', { user: req.session.user, types: types, message: message, departaments: departaments });
    
  });


});


router.post('/create/type', adminAuth, (req, res) => {
    const type = req.body.type;
    const departament = req.body.departament;

    console.log("Type: " + type);

    Profile.findOne({
        where: {
          description: departament
        }
      }).then(findProfile => {
    
        if (findProfile) { // Check if a profile was found
          console.log("Profile ID" + findProfile.id);
      
          Type.create({
            type: type,
            profile_id: findProfile.id
          }).catch(err => console.log(err));
        } else {
          console.error("Profile not found for department:", departament);
          // Handle the case where the profile is not found (e.g., redirect with an error message)
        }
    
      }).catch(err => console.log(err));

   
  
    req.flash('message', 'Tipo cadastrado com sucesso!')
    
   // After creating the category, wait for 2 seconds before redirecting
   setTimeout(() => {
    res.redirect('/typesCauses');
  }, 2000); // 2000 milliseconds = 2 seconds
  });

  router.get('/delete/type/:id', adminAuth, async (req, res) => {

    const id = req.params.id;
    
    Type.destroy({
        where: {
          id: id
        }
      });
    
      req.flash('message', 'Tipo deletado com sucesso!')
      res.redirect('/typesCauses');
    
    });

module.exports = router;