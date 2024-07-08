const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const fs = require('fs-extra'); // Import fs for file operations
const Payment = require('../payments/Payment');
const { where } = require('sequelize');

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

router.get('/payments', (req, res) => {
  res.render('payments/index.ejs', { user: req.session.user });
});

router.post('/upload', upload.array('files'), (req, res) => {
  const supplier = req.body.supplier;
  console.log("supplier: " + supplier);
  const employee = req.body.employee;
  console.log("employee: " + employee);
  const description = req.body.description;
  console.log("description: " + description);
  const expiration = req.body.expiration;
  console.log("expiration: " + expiration);
  const value = req.body.value;
  console.log("value: " + value);
  const payment_method = req.body.payment_method;
  console.log("payment_method: " + payment_method);
  const bank =  req.body.bank;
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

  const files = req.files;

  
Payment.create({
where: {
  employee_id: req.session.user.employee.id
},
  description: description,
  value: value,
  expiration_date:"2024-12-11",
  employee_id: req.session.user.employee.id,
  supplier_id: 1

}).catch(error => {
  console.error('Error creating payment:', error);
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
    }
    


  } else {
    console.error('No files were uploaded.');
  }

  res.send('Upload realizado com sucesso!');
});

module.exports = router;
