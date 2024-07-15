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
const Unit = require('../users/Unit');
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


router.get('/purchases', (req, res) => {

  let message = "Requisição de compras/serviços criada com sucesso";

  if(req.query.success){
  
    res.render('purchaseAndServices/index.ejs', { user: req.session.user, message: message });

  }else{

    res.render('purchaseAndServices/index.ejs', { user: req.session.user, message: '' });

  }
  
});



router.post('/upload/purchases/revision_orcament', upload.array('files'), async (req, res) => {


  const files = req.files;
  var item = req.body.newitem1;


  var count = 1;
  var total = 0.00;

  while (item != undefined) {

    let valorF = req.body['newvalue' + count].replace('.', ' ');
    let arrValor = valorF.split(" ");
    if (arrValor.length == 3) {
      valorF = arrValor[0] + arrValor[1] + arrValor[2];
    } else if (arrValor.length == 2) {

      valorF = arrValor[0] + arrValor[1];

    }

    valorF = valorF.replace(',', '.');

    total += parseFloat(valorF) * req.body['newamount' + count];


    count++;
    item = req.body['newitem' + count];

  }

  console.log("Total: " + total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));


  Purchase.update({
    total: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    status: 'Em análise pelo diretor',
    purchase_id: req.session.user.employee.id
  }, {
    where: {
      id: req.body.purchase_id
    }
  }).catch(err => console.log(err));


  item = req.body.newitem1;
  count = 1;

  while (item != undefined) {

    if (req.body['newvalue' + count] != undefined) {

      console.log(req.body['newamount' + count]);
      console.log(req.body['newitem' + count]);
      console.log(req.body['newdescription' + count]);
      console.log(req.body['newvalue' + count]);

      let valorF = req.body['newvalue' + count].replace('.', ' ');
      let arrValor = valorF.split(" ");
      if (arrValor.length == 3) {
        valorF = arrValor[0] + arrValor[1] + arrValor[2];
      } else if (arrValor.length == 2) {

        valorF = arrValor[0] + arrValor[1];

      }

      valorF = valorF.replace(',', '.');

      Item.update({

        amount: req.body['newamount' + count],
        item: req.body['newitem' + count],
        description: req.body['newdescription' + count],
        value: parseFloat(valorF).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
       { where: {
          purchase_id: req.body.purchase_id,
          amount: req.body['newamount' + count],
          item: req.body['newitem' + count],
          description: req.body['newdescription' + count]
       }  

    }).catch(err => console.log("Erro aqui:" +err));

    }


    count++;
    item = req.body['newitem' + count];

  }


    

  // Check if any files were uploaded
  if (files && files.length > 0) {
    // Processar os dados e o arquivo aqui
    //console.log(`Nome: ${nome}`);

      //deletar arquivo
      const archives = await  File.findAll({
        where: {
          purchase_id: req.body.purchase_id
        }
      });

      archives.forEach(archive => {
        let directory_path = `uploads/${archive}`;

        fs.unlink(directory_path, (err) => {
          if (err) {
            console.error(err);
            console.log('Erro ao excluir o arquivo');
            return;
          }
          console.log('Arquivo excluído com sucesso');
        });
      });

    // Processar arquivos
    for (const file of files) {
      // Salvar o arquivo
      const fileName = file.originalname;
      const uniqueFileName = Date.now() + '_' + fileName; // Generate a unique filename
      const filePath = `uploads/${uniqueFileName}`; // Use the unique filename
      fs.moveSync(file.path, filePath);
      console.log(`Arquivo recebido: ${file.originalname}`);
      // Salvar arquivo no diretório de destino 
  
      File.destroy(
        {
          where: {
            purchase_id: req.body.purchase_id
          }
        }
      ).catch(error => {
        console.error('Error deleting file:', error);
      });
  

      File.create({
        fileName: uniqueFileName,
        purchase_id: req.body.purchase_id
        
      }).catch(error => {
        console.error('Error creating file:', error);
      });
  
    }
  
  } else {
    console.error('No files were uploaded.');
  }
  
  res.redirect('/dashboard/pending?success=true');

});



router.get('/revision_orcament/:id', async (req, res) => {
  const id = req.params.id;

  var leader_employee = null;
  var director_employee = null;
  var financial_employee = null;
  var purchase_employee = null;

  const purchase = await Purchase.findByPk(id);

  if (purchase.leader_id != null) {

    leader_employee = await Employee.findByPk(purchase.leader_id);

  }

  if (purchase.director_id != null) {

    director_employee = await Employee.findByPk(purchase.director_id);

  }

  if (purchase.purchase_id != null) {

    purchase_employee = await Employee.findByPk(purchase.purchase_id);

  }

  if (purchase.financial_id != null) {

    financial_employee = await Employee.findByPk(purchase.financial_id);

  }

  const employee = await Employee.findByPk(purchase.employee_id);
  const item = await Item.findAll({ where: { purchase_id: purchase.id } });
  const sector = await Sector.findByPk(employee.sector_id);
  const files = await File.findAll({ where: { purchase_id: purchase.id } });

  res.render('purchaseAndServices/revision_orcament.ejs', { leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, items: item, sector, files, user: req.session.user, purchase_id: id });
});


router.post('/purchase/accept/financial', upload.array('files'), async (req, res) => {

  const id = req.body.purchase_id;
  const files = req.files;

  Purchase.update({

    status: 'APROVADO',
    financial_id: req.session.user.employee.id

  }, {
    where: {
      id: id
    }
  })
    .catch(error => {
      console.error('Error updating purchase:', error);
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
        purchase_id: id
      }).then(result => {
        console.log('File created successfully:', result);
      })
      .catch(error => {
        console.error('Error creating file:', error);
      });

    }

  } else {
    console.error('No files were uploaded.');
  }


  res.redirect('/dashboard/pending?success=true');

});





router.post('/purchase/accept/leaders', upload.array('files'), async (req, res) => {

  const id = req.body.purchase_id;
  const files = req.files;

  Purchase.update({

    status: 'Em análise pelo compras',
    leader_id: req.session.user.employee.id

  }, {
    where: {
      id: id
    }
  })
    .catch(error => {
      console.error('Error updating purchase:', error);
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
        purchase_id: id
      }).catch(error => {
        console.error('Error creating file:', error);
      });

    }

  } else {
    console.error('No files were uploaded.');
  }


  res.redirect('/dashboard/pending?success=true');

});


router.get('/purchase/reprove/leaders/:id', (req, res) => {

  const id = req.params.id;

  res.redirect(`/purchases/${id}?modal=true`)


});

router.post('/purchase/reprove/leaders', (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  Purchase.update({

    status: 'REPROVADO',
    leader_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
    .then(result => {
      console.log('Purchase updated successfully:', result);
    })
    .catch(error => {
      console.error('Error updating purchase:', error);
    });

  res.redirect('/dashboard?error=true');

});


router.get('/purchase/accept/directors/:id', (req, res) => {

  const id = req.params.id;


  Purchase.update({

    status: 'Pagamento em andamento',
    director_id: req.session.user.employee.id

  }, {
    where: {
      id: id
    }
  }).then(result => {
    console.log('Purchase updated successfully:', result);
  
  }).catch(error => {
      console.error('Error updating purchase:', error);
    });


  res.redirect('/dashboard/pending?success=true');

});


router.get('/purchase/reprove/directors/:id', (req, res) => {

  const id = req.params.id;
  Purchase.update({

    status: 'REPROVADO',
    director_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
    .then(result => {
      console.log('Purchase updated successfully:', result);
    })
    .catch(error => {
      console.error('Error updating purchase:', error);
    });

    res.redirect('/dashboard?error=true');

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
  res.sendFile(fileName, { root: 'uploads' });
});


router.get('/purchases/:id', adminAuth, async (req, res) => {
  const id = req.params.id;
  var leader_employee = null;
  var director_employee = null;
  var financial_employee = null;
  var purchase_employee = null;

  const purchase = await Purchase.findByPk(id);

  if (purchase.leader_id != null) {

    leader_employee = await Employee.findByPk(purchase.leader_id);

  }

  if (purchase.director_id != null) {

    director_employee = await Employee.findByPk(purchase.director_id);

  }

  if (purchase.purchase_id != null) {

    purchase_employee = await Employee.findByPk(purchase.purchase_id);

  }

  if (purchase.financial_id != null) {

    financial_employee = await Employee.findByPk(purchase.financial_id);

  }

  const employee = await Employee.findByPk(purchase.employee_id);
  const item = await Item.findAll({ where: { purchase_id: purchase.id } });
  const sector = await Sector.findByPk(employee.sector_id);
  const files = await File.findAll({ where: { purchase_id: purchase.id } });
  const unit = await Unit.findByPk(employee.unit_id);


  if (purchase == undefined) {
    console.log("Payment undefinied")
  }else if (employee == undefined) {
    console.log("Employee undefinied")
  }else if (sector == undefined) {
    console.log("Sector undefinied")
  }else if (unit == undefined) {
    console.log("Unit undefinied")
  }else if (item == undefined) {
    console.log("Item undefinied")
  }else if (files == undefined) {
    console.log("Files undefinied")
  }


  if(req.query.modal){

    res.render('purchaseAndServices/show.ejs', { leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user, unit, modal: true });


  }else{

    res.render('purchaseAndServices/show.ejs', { leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user, unit, modal: false });

  }



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

  res.redirect('/purchases/?success=true');

});

module.exports = router;
