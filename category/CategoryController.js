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


router.get('/category',adminAuth, async (req, res) => {

    const departaments = [{name:'SAC', profile:'sac'}, {name:'T.I', profile:'ti'}, {name:'RH', profile:'rh'},
        {name:'FINANCEIRO', profile:'financial'}, {name:'MARKETING', profile:'marketing'}, {name:'COMPRAS', profile:'purchases'}    
     ];

     const categories = await Category.findAll();


    res.render('call/categories', { user: req.session.user, departaments: departaments, categories: categories });

});

router.post('/create/category', adminAuth, async (req, res) => {
  const departament = req.body.departament;
  const description = req.body.describe;

  console.log("Despartamento" + departament);
  console.log("Descrição" + description);

  // Use await to wait for the promise to resolve
  const findProfile = await Profile.findOne({
    where: {
      description: departament
    }
  });

  if (findProfile) { // Check if a profile was found
    console.log("Profile ID" + findProfile.id);

    Category.create({
      departament: departament,
      description: description,
      profile_id: findProfile.id
    }).catch(err => console.log(err));
  } else {
    console.error("Profile not found for department:", departament);
    // Handle the case where the profile is not found (e.g., redirect with an error message)
  }

  res.redirect('/category');
});


router.get('/delete/category/:id', adminAuth, async (req, res) => {

const id = req.params.id;

Category.destroy({
    where: {
      id: id
    }
  });

  res.redirect('/category');

});




module.exports = router;