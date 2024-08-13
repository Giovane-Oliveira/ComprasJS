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



router.get('/call/dashboard',adminAuth, async (req, res) => {

res.render('call/dashboard', { user: req.session.user });

});

router.get('/call/create',adminAuth, async (req, res) => {

    const departaments = [{name:'SAC', profile:'sac'}, {name:'T.I', profile:'ti'}, {name:'RH', profile:'rh'},
        {name:'FINANCEIRO', profile:'financial'}, {name:'MARKETING', profile:'marketing'}, {name:'COMPRAS', profile:'purchases'}    
     ]
//ti
     const profile_ti = await Profile.findOne({
        where: {
          description: 'ti'
        }
      });

      const ti_categories = await Category.findAll({
        where: {
          profile_id: profile_ti.id
        }
      });

      ti_categories.forEach(element => {
        
        console.log("Categoria " + element.description);
      });
//financial
      const profile_financial = await Profile.findOne({
        where: {
          description: 'financial'
        }
      });

      const financial_categories = await Category.findAll({
        where: {
          profile_id: profile_financial.id
        }
      });

      financial_categories.forEach(element => {
        
        console.log("Categoria " + element.description);
      });

//marketing
const profile_marketing = await Profile.findOne({
    where: {
      description: 'marketing'
    }
  });

  const marketing_categories = await Category.findAll({
    where: {
      profile_id: profile_marketing.id
    }
  });

  marketing_categories.forEach(element => {
    
    console.log("Categoria " + element.description);
  });

  //purchases
  const profile_purchases = await Profile.findOne({
    where: {
      description: 'purchases'
    }
  });

  const purchases_categories = await Category.findAll({
    where: {
      profile_id: profile_purchases.id
    }
  });

  purchases_categories.forEach(element => {
    
    console.log("Categoria " + element.description);
  });

  //rh
  const profile_rh = await Profile.findOne({
    where: {
      description: 'rh'
    }
  });

  const rh_categories = await Category.findAll({
    where: {
      profile_id: profile_rh.id
    }
  });

  rh_categories.forEach(element => {
    
    console.log("Categoria " + element.description);
  });

  //sac
  const profile_sac = await Profile.findOne({
    where: {
      description: 'sac'
    }
  });

  const sac_categories = await Category.findAll({
    where: {
      profile_id: profile_sac.id
    }
  });

  sac_categories.forEach(element => {
    
    console.log("Categoria " + element.description);
  });

    res.render('call/create', { user: req.session.user, departaments: departaments, ti_categories: ti_categories, 
        financial_categories: financial_categories, marketing_categories: marketing_categories,
    purchases_categories: purchases_categories, rh_categories: rh_categories, sac_categories: sac_categories});

});

router.get('/call/show',adminAuth, async (req, res) => {


    res.render('call/show', { user: req.session.user });

});



module.exports = router;