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
const File =  require( '../users/File');
const Employee = require('../employees/Employee');
const Sector = require('../users/Sector');
const Unit = require('../users/Unit');
const Company = require('../companies/Company');



// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to save files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  }
});
const upload = multer({ storage: storage }); // Create the upload middleware


router.get('/payments/:id', async (req, res) => {
 
  const id = req.params.id;
  const payment = await Payment.findByPk(id);
  const employee = await Employee.findByPk(payment.employee_id);
  const supplier = await Supplier.findByPk(payment.supplier_id);
  const sector = await Sector.findByPk(employee.sector_id);
  const unit = await Unit.findByPk(employee.unit_id);
  const payment_method = await Payment_Method.findByPk(payment.id);
  const company = await Company.findByPk(payment.company_id);

  if (payment == undefined) {
    console.log("Payment undefinied")
  }else if (employee == undefined) {
    console.log("Employee undefinied")
  }else if (supplier == undefined) {
    console.log("Supplier undefinied")
  }else if (sector == undefined) {
    console.log("Sector undefinied")
  }else if (unit == undefined) {
    console.log("Unit undefinied")
  }else if (payment_method == undefined) {
    console.log("Payment_method undefinied")
  }

res.render('payments/show.ejs', { user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company  });

});




router.get('/payments', (req, res) => {


  Supplier.findAll({}).then(suppliers => {

    Company.findAll({
      where: {
        name: {
          [Op.like]: `% ${req.session.user.unit.city.toUpperCase()}%`
        }
      }
    }).then(companies => {

      res.render('payments/index.ejs', { user: req.session.user, suppliers: suppliers, companies: companies });

    });

  }).catch(error => {
    console.error('Error retrieving suppliers:', error);
  });
});

router.post('/upload/payments', upload.array('files'), async(req, res) => {
  const supplier = req.body.supplier;
  console.log("supplier: " + supplier);
  const company = req.body.company;
  console.log("company: " + company);
  const description = req.body.description;
  console.log("description: " + description);
  const expiration = req.body.expiration;
  console.log("expiration: " + expiration);
  const value = req.body.value;
  console.log("value: " + value);
  const payment_method = req.body.payment_method;
  console.log("payment_method: " + payment_method);
  const bank = req.body.bank;
  console.log("bank: " + bank);
  const agency = req.body.agency;
  console.log("agency: " + agency);
  const currency_account = req.body.currency_account;
  console.log("currency_account: " + currency_account);
  const cpf = req.body.cpf;
  console.log("cpf: " + cpf);
  const phone = req.body.phone;
  console.log("phone: " + phone);
  const email = req.body.email;
  console.log("email: " + email);
  const ticket = req.body.ticket;
  console.log("ticket: " + ticket);
  const avista = req.body.avista;
  console.log("avista: " + avista);
  const cnpj = req.body.cnpj;
  console.log("cnpj: " + cnpj);



  const files = req.files;

  var dateFormat = expiration.split("/").reverse().join("-");
  console.log("dataFormata: " + dateFormat);

 const newPayment = await Payment.create({
    /*where: {
      employee_id: req.session.user.employee.id
    },*/
    description: description,
    value: value,
    expiration_date: dateFormat,
    employee_id: req.session.user.employee.id,
    supplier_id: supplier,
    company_id: company

  }).catch(error => {
    console.error('Error creating payment:', error);
  });

  await Payment_Method.create({

    payment_method: payment_method,
    bank: bank,
    agency: agency,
    currency_account: currency_account,
    ticket: ticket,
    cpf: cpf,
    cnpj: cnpj,
    phone: phone,
    email: email,
    phone: phone,
    avista: avista,
    payment_id: newPayment.id

  }).catch(error => {
    console.error('Error creating payment_method:', error);
  });

  // Check if any files were uploaded
  if (files && files.length > 0) {
    // Processar os dados e o arquivo aqui
    //console.log(`Nome: ${nome}`);
    // Processar arquivos
    for (const file of files) {
      // Salvar o arquivo
      const fileName = file.originalname;
      const uniqueFileName = Date.now() + '_' + fileName; // Generate a unique filename
      const filePath = `uploads/${uniqueFileName}`; // Use the unique filename
      fs.moveSync(file.path, filePath);
      console.log(`Arquivo recebido: ${file.originalname}`);
      // Salvar arquivo no diretório de destino 

    await File.create({
        fileName: uniqueFileName,
        payment_id: newPayment.id
      }).catch(error => {
        console.error('Error creating file:', error);
      });

    }
  } else {
    console.error('No files were uploaded.');
  }

  res.redirect('/payments');

});

module.exports = router;
