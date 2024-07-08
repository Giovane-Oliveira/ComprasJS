const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const fs = require('fs'); // Import fs for file operations

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

router.post('/upload', upload.array('anexo[]'), (req, res) => {
  const supplier = req.body.supplier;
  const employee = req.body.employee;
  const description = req.body.description;
  const expiration = req.body.expiration;
  const value = req.body.value;
  const payment_method = req.body.payment_method;
  const bank =  req.body.bank;
  const agency = req.body.agency;
  const currency_account = req.body.currency_account;
  const cpf = req.body.cpf;
  const phone = req.body.phone;
  const email = req.body.email;
  const ticket = req.body.ticket;
  const avista = req.body.avista;
  const files = req.files;

  // Check if any files were uploaded
  if (files && files.length > 0) {
    // Processar os dados e o arquivo aqui
    //console.log(`Nome: ${nome}`);

    // Processar arquivos
    for (const file of files) {
      // Salvar o arquivo
      const fileName = file.originalname;
      const filePath = `uploads/${fileName}`;
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
