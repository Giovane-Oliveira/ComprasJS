const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs-extra');
const Purchase = require('./Purchase');
const adminAuth = require('../middlewares/adminAuth');
const Employee = require('../employees/Employee');
const Item = require('./Item');
const Sector = require('../users/Sector');
const File = require('../users/File');


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

router.get('/purchases', (req, res) => {
    res.render('purchaseAndServices/index.ejs', { user: req.session.user });
});

router.get('/purchase/download/:arquivo', (req, res) => {
    // Obter o nome do arquivo
    const fileName = req.params.arquivo;
    const filePath = `uploads/${fileName}`;
  
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Arquivo não encontrado!');
      return;
    }
  
    // Enviar o arquivo como download
    res.header('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(fileName,  { root: 'uploads' });
  });
  

router.get('/purchases/:id', adminAuth, async (req, res) => {
    const id = req.params.id;
    var leader_employee = null;
    var director_employee = null;
    var financial_employee = null;
    var purchase_employee = null;

    const purchase = await Purchase.findByPk(id);

    if(purchase.leader_id != null){

       leader_employee = await Employee.findByPk(purchase.leader_id);

    }
    
    if(purchase.director_id != null){

      director_employee = await Employee.findByPk(purchase.director_id);

    }

    if(purchase.purchase_id != null){

        purchase_employee = await Employee.findByPk(purchase.purchase_id);

    }

    if(purchase.financial_id != null){

         financial_employee = await Employee.findByPk(purchase.financial_id);

    }

    const employee = await Employee.findByPk(purchase.employee_id);
    const item = await Item.findAll({ where: { purchase_id: purchase.id } });
    const sector = await Sector.findByPk(employee.sector_id);
    const files = await File.findAll({ where: { purchase_id: purchase.id } });

    res.render('purchaseAndServices/show.ejs', { leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user });

});




router.post('/upload/purchases', upload.array('files'), async (req, res) => {

    const justification = req.body.justification;
    console.log(justification);
    const files = req.files;

    var item = req.body.item1;
    var count = 1;
    var total = 0.00;

    while (item != undefined) {

        let valorF = req.body['value' + count].replace('.', ' ');
        let arrValor = valorF.split(" ");
        if (arrValor.length == 3) {
            valorF = arrValor[0] + arrValor[1] + arrValor[2];
        } else if (arrValor.length == 2) {

            valorF = arrValor[0] + arrValor[1];

        }

        valorF = valorF.replace(',', '.');

        total += parseFloat(valorF) * req.body['amount' + count];


        count++;
        item = req.body['item' + count];

    }

    console.log("Total: " + total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    const newPurchase = await Purchase.create({
        justification: justification,
        total: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        employee_id: req.session.user.employee.id
    }).catch(err => console.log(err));

    item = req.body.item1;
    count = 1;

    while (item != undefined) {

        console.log(req.body['amount' + count]);
        console.log(req.body['item' + count]);
        console.log(req.body['description' + count]);
        console.log(req.body['value' + count]);

        let valorF = req.body['value' + count].replace('.', ' ');
        let arrValor = valorF.split(" ");
        if (arrValor.length == 3) {
            valorF = arrValor[0] + arrValor[1] + arrValor[2];
        } else if (arrValor.length == 2) {

            valorF = arrValor[0] + arrValor[1];

        }

        valorF = valorF.replace(',', '.');

        Item.create({
            amount: req.body['amount' + count],
            item: req.body['item' + count],
            description: req.body['description' + count],
            value: parseFloat(valorF).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            purchase_id: newPurchase.id

        }).catch(err => console.log(err));

        count++;
        item = req.body['item' + count];

    }

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

      File.create({
        fileName: uniqueFileName,
        purchase_id: newPurchase.id
      }).catch(error => {
        console.error('Error creating file:', error);
      });

    }
  } else {
    console.error('No files were uploaded.');
  }

  res.redirect('/purchases');

});

module.exports = router;
