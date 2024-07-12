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


router.post('/payment/accept/financial', upload.array('files'), async (req, res) => {

  const id = req.body.payment_id;
   const files = req.files;

  Payment.update({

    status: 'APROVADO',
    financial_id: req.session.user.employee.id

  }, {
    where: {
      id: id
    }  
})
  .catch(error => {
    console.error('Error updating payment:', error);
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
      payment_id: id
    }).catch(error => {
      console.error('Error creating file:', error);
    });

  }

} else {
  console.error('No files were uploaded.');
}


res.redirect('/dashboard/pending');

});



router.get('/payment/accept/purchases/:id', (req, res) => {

  const id = req.params.id;
  Payment.update({

    status: 'Pagamento em andamento',
    purchase_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
  .then(result => {
    console.log('Payment updated successfully:', result);
})
  .catch(error => {
    console.error('Error updating payment:', error);
  });

  res.redirect('/dashboard/pending');

});


router.get('/payment/reprove/purchases/:id', (req, res) => {

  const id = req.params.id;
  Payment.update({

    status: 'REPROVADO',
    purchase_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
  .then(result => {
    console.log('Payment updated successfully:', result);
})
  .catch(error => {
    console.error('Error updating payment:', error);
  });

  res.redirect('/dashboard');

});


router.get('/payment/accept/directors/:id', (req, res) => {

  const id = req.params.id;
  Payment.update({

    status: 'Em análise pelo compras',
    director_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
  .then(result => {
    console.log('Payment updated successfully:', result);
})
  .catch(error => {
    console.error('Error updating payment:', error);
  });

  res.redirect('/dashboard/pending');

});


router.get('/payment/reprove/directors/:id', (req, res) => {

  const id = req.params.id;
  Payment.update({

    status: 'REPROVADO',
    director_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
  .then(result => {
    console.log('Payment updated successfully:', result);
})
  .catch(error => {
    console.error('Error updating payment:', error);
  });

  res.redirect('/dashboard');

});


router.get('/payment/accept/leaders/:id', (req, res) => {

  const id = req.params.id;
  Payment.update({

    status: 'Em análise pelo diretor',
    leader_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
  .then(result => {
    console.log('Payment updated successfully:', result);
})
  .catch(error => {
    console.error('Error updating payment:', error);
  });

  res.redirect('/dashboard/pending');

});


router.get('/payment/reprove/leaders/:id', (req, res) => {

  const id = req.params.id;
  Payment.update({

    status: 'REPROVADO',
    leader_id: req.session.user.employee.id
  }, {
    where: {
      id: id
    }
  })
  .then(result => {
    console.log('Payment updated successfully:', result);
})
  .catch(error => {
    console.error('Error updating payment:', error);
  });

  res.redirect('/dashboard');

});



router.get('/payments/:id', async (req, res) => {
 
  const id = req.params.id;
  const payment = await Payment.findByPk(id);


  if(payment.leader_id != null){

    console.log("leader_id: " + payment.leader_id);
    leader_employee = await Employee.findByPk(payment.leader_id);

 }
 
 if(payment.director_id != null){

   director_employee = await Employee.findByPk(payment.director_id);

 }

 if(payment.purchase_id != null){

     purchase_employee = await Employee.findByPk(payment.purchase_id);

    console.log("purchase_employee: " + purchase_employee)


 }

 if(payment.financial_id != null){

      financial_employee = await Employee.findByPk(payment.financial_id);

 }



  const employee = await Employee.findByPk(payment.employee_id);
  const supplier = await Supplier.findByPk(payment.supplier_id);
  const sector = await Sector.findByPk(employee.sector_id);
  const unit = await Unit.findByPk(employee.unit_id);
  const payment_method = await Payment_Method.findByPk(payment.id);
  const company = await Company.findByPk(payment.company_id);


  const files = await File.findAll({
    where: {
      payment_id: payment.id
    }
  });
  
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
  }else if (company == undefined) {
    console.log("Company undefinied")
  }

res.render('payments/show.ejs', { leader_employee, director_employee, purchase_employee, financial_employee, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files});

});


router.get('/payment/download/:arquivo', (req, res) => {
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
