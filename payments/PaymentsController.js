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
/*
let transporter = nodemailer.createTransport({
  host: 'mail.provida.med.br', // Substitua pelo endereço do seu servidor SMTP
  port: 587, // Substitua pela porta do seu servidor SMTP
  secure: false, // Use TLS ou SSL
  auth: {
    user: 'suporte.ti@grupoprovida.com.br', // Substitua pelo seu email corporativo
    pass: 'HJ^c+4_gAwiF' // Substitua pela senha do seu email corporativo
  }
});
*/

let transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com', // Substitua pelo endereço do seu servidor SMTP
  port: 587, // Substitua pela porta do seu servidor SMTP
  secure: false, // Use TLS ou SSL
  tls: {
    ciphers:'SSLv3',
    rejectUnauthorized: false,
 },
  auth: {
      user: 'suporte.ti@grupoprovida.com.br', // Substitua pelo seu email corporativo
      pass: 'adminPV@2024' // Substitua pela senha do seu email corporativo
  },
  debug: true,
  logger:true
}); 

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


router.post('/payment/accept/financial', upload.array('files'), adminAuth, async (req, res) => {

  const id = req.body.payment_id;
  const files = req.files;

  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(payment.leader_id).catch(err => console.log(err));
  const director = await Employee.findByPk(payment.director_id).catch(err => console.log(err));
  const purchase = await Employee.findByPk(payment.purchase_id).catch(err => console.log(err));
  const financial = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));


  // Update payment status
  Payment.update({
    status: 'APROVADO',
    financial_id: req.session.user.employee.id
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

  var emails = [];


  if(leader == undefined){

    emails = [director.email, purchase.email, req.session.user.employee.email];


  }else{

    emails = [manager.email, leader.email, director.email, purchase.email, financial.email];


  }



  await Movement.create({

    financial_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'APROVADO'

  }).catch(err => console.log(err));



  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Financeiro efetuou o pagamento.";
    let mail_employee = "Colaborador(a): " + financial.name;
    let mail_email =  "E-mail: " + financial.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  // Update payment status
  Payment.update({
    status: 'APROVADO',
    financial_id: req.session.user.employee.id
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

  // APROVADO financial_id

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

  req.flash('success', 'Enviado com sucesso!')
  res.redirect('/dashboard/pending');

});



router.get('/payment/accept/purchases/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(payment.leader_id).catch(err => console.log(err));
  const director = await Employee.findByPk(payment.director_id).catch(err => console.log(err));
  const purchase = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  // Update payment status
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


  //movements
  await Movement.create({

    purchase_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'Pagamento em andamento',

  }).catch(err => console.log(err));
  //movements

  const financial = await Profile.findAll({
    where: {
      description: 'financial'
    }
  }).catch(err => console.log(err));

  const financialLoginsPromises = financial.map(async (finance) => {
    let user = await User.findOne({
      where: {
        profile_id: finance.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  });

  const financialLogins = await Promise.all(financialLoginsPromises);

 var emails = [];


  if(leader == undefined){

    emails = [req.session.user.employee.email, ...financialLogins];

  }else{
    emails = [manager.email, leader.email, director.email, purchase.email, ...financialLogins];
  }


  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Compras aceitou a solicitação de pagamento.";
    let mail_employee = "Comprador(a): " + purchase.name;
    let mail_email =  "E-mail: " + purchase.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  req.flash('success', 'Enviado com sucesso!')
  res.redirect('/dashboard/pending');

});

router.get('/payment/reprove/purchases/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  req.flash('modal', 'purchases');
  res.redirect(`/payments/${id}`);

});

router.post('/payment/reprove/purchases', adminAuth, async (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const director = await Employee.findByPk(payment.director_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(payment.leader_id).catch(err => console.log(err));
  const purchase = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));
  //const financial = await Employee.findByPk(payment.financial_id);

  var emails = [];

if(leader == undefined){

  emails = [director.email, req.session.user.employee.email];

}else{

  emails = [manager.email, director.email, leader.email, purchase.email];

}

  //movement
  await Movement.create({

    purchase_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'REPROVADO'

  }).catch(err => console.log(err));

  //movement

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

  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Setor de compras recusou a solicitação de pagamento.";
    let mail_employee = "Comprador(a): " + purchase.name;
    let mail_email =  "E-mail: " + purchase.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link, justification: "Motivo: " + motivo})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {

      console.log("Erro ao enviar o email: " + error);

    }


  });

  req.flash('error', 'Solicitação reprovada com sucesso!');
  res.redirect('/dashboard');

});


router.get('/payment/accept/directors/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(payment.leader_id).catch(err => console.log(err));
  const director = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));


    // Update payment status
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

  //movements
  await Movement.create({

    director_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'Em análise pelo compras',

  }).catch(err => console.log(err));
  //movements

  const purchases = await Profile.findAll({
    where: {
      description: 'purchases'
    }
  }).catch(err => console.log(err));

  const purchaseLoginsPromises = purchases.map(async (purchase) => {
    let user = await User.findOne({
      where: {
        profile_id: purchase.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  });

  const purchaseLogins = await Promise.all(purchaseLoginsPromises);


  const emails = [manager.email, leader.email, director.email, ...purchaseLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Diretor(a) aceitou a solicitação de pagamento.";
    let mail_employee = "Diretor(a): " + director.name;
    let mail_email =  "E-mail: " + director.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  req.flash('success', 'Enviado com sucesso!')
  res.redirect('/dashboard/pending');

  //Em análise pelo compras director_id

});

router.get('/payment/reprove/directors/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  req.flash('modal', 'directors');
  res.redirect(`/payments/${id}`);


});

router.post('/payment/reprove/directors', adminAuth, async (req, res) => {

  const id = req.body.id;
  const motivo = req.body.motivo;

  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const director = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));
  const leader = await Employee.findByPk(payment.leader_id).catch(err => console.log(err));


  var emails = [];

  if(manager.email == leader.email){

    emails = [leader.email, director.email];

  }else{

    emails = [manager.email, leader.email, director.email];
  }


  //movement
  await Movement.create({

    director_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'REPROVADO'

  }).catch(err => console.log(err));
  //movement

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

  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Diretor(a) recusou a solicitação de pagamento.";
    let mail_employee = "Diretor(a): " + director.name;
    let mail_email =  "E-mail: " + director.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link, justification: "Motivo: " + motivo})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {

      console.log("Erro ao enviar o email: " + error);

    }

  });

  req.flash('error', 'Solicitação reprovada com sucesso!');
  res.redirect('/dashboard');

});



router.get('/payment/accept/leaders/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  //movements
  await Movement.create({

    leader_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'Em análise pelo diretor'

  }).catch(err => console.log(err));
  //movements

  // Fetch all directors asynchronously
  const directors = await Profile.findAll({
    where: {
      description: 'directors'
    }
  });

  // Now you can use map on the directors array
  const directorLoginsPromises = directors.map(async (director) => {
    let user = await User.findOne({
      where: {
        profile_id: director.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  });

  // Wait for all director logins to be fetched
  const directorLogins = await Promise.all(directorLoginsPromises);

  // Combine all emails into a single array
  const emails = [manager.email, leader.email, ...directorLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor(a) aceitou a solicitação de pagamento.";
    let mail_employee = "Gestor(a): " + leader.name;
    let mail_email =  "E-mail: " + leader.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  // Update payment status
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

  req.flash('success', 'Enviado com sucesso!')
  res.redirect('/dashboard/pending');
});


router.get('/payment/reprove/leaders/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  req.flash('modal', 'leaders');
  res.redirect(`/payments/${id}`);

});


router.post('/payment/reprove/leaders', adminAuth, async (req, res) => {

  const id = req.body.id;
  const motivo = req.body.motivo;

  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  //movement
  await Movement.create({

    leader_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'REPROVADO'

  }).catch(err => console.log(err));
  //movement

  const emails = [manager.email, leader.email];


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

  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor(a) recusou a solicitação de pagamento.";
    let mail_employee = "Gestor(a): " + leader.name;
    let mail_email =  "E-mail: " + leader.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link, justification: "Motivo: " + motivo})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {

      console.log("Erro ao enviar o email: " + error);

    }

  });

  req.flash('error', 'Solicitação reprovada com sucesso!');
  res.redirect('/dashboard');

});



router.get('/payments/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id).catch(err => console.log(err));
  var modal = req.flash('modal');

  modal = (modal == undefined || modal.length == 0) ? '' : modal;


  if (payment.leader_id != null) {

    console.log("leader_id: " + payment.leader_id);
    leader_employee = await Employee.findByPk(payment.leader_id).catch(err => console.log(err));

  }

  if (payment.director_id != null) {

    director_employee = await Employee.findByPk(payment.director_id).catch(err => console.log(err));

  }

  if (payment.purchase_id != null) {

    purchase_employee = await Employee.findByPk(payment.purchase_id).catch(err => console.log(err));

    console.log("purchase_employee: " + purchase_employee)


  }

  if (payment.financial_id != null) {

    financial_employee = await Employee.findByPk(payment.financial_id).catch(err => console.log(err));

  }

  const employee = await Employee.findByPk(payment.employee_id).catch(err => console.log(err));
  const supplier = await Supplier.findByPk(payment.supplier_id).catch(err => console.log(err));
  const sector = await Sector.findByPk(employee.sector_id).catch(err => console.log(err));
  const unit = await Unit.findByPk(employee.unit_id).catch(err => console.log(err));
  const payment_method = await Payment_Method.findByPk(payment.id).catch(err => console.log(err));
  const payment_condition = await Payment_Condition.findOne({
    where: {
      payment_method_id: payment_method.id
    }
  }).catch(err => console.log(err));
  const company = await Company.findByPk(payment.company_id).catch(err => console.log(err));


  const files = await File.findAll({
    where: {
      payment_id: payment.id
    }
  }).catch(err => console.log(err));

  

    const movements = await Movement.findAll({
      where: {
        payment_id: payment.id
      }
    }).catch(err => console.log(err));

    if (movements == undefined) {
      console.log("Movements undefinied")

    }

     const movement_users =  movements.map(async (movement) => {

    if (movement.employee_id != undefined) {

       let manager_employee = await Employee.findOne({
          where: {
            id: movement.employee_id
          }
        }).catch(err => console.log(err));
        console.log('Gerente carregado!')
        return manager_employee; 

      } else if (movement.leader_id != undefined) {

       let leader_employee = await Employee.findOne({
          where: {
            id: movement.leader_id
          }
        }).catch(err => console.log(err));

        console.log('Gestor carregado!');
        return leader_employee;
       
      } else if (movement.director_id != undefined) {

       let director_employee = await Employee.findOne({
          where: {
            id: movement.director_id
          }
        }).catch(err => console.log(err));

        console.log('Diretor carregado!');
        return director_employee;
    
      } else if (movement.purchase_id != undefined) {

        let purchase_employee = await Employee.findOne({
          where: {
            id: movement.purchase_id
          }
        }).catch(err => console.log(err));

        console.log('Compras carregado!');
        return purchase_employee;

      } else if (movement.financial_id != undefined) {

       let financial_employee = await Employee.findOne({
          where: {
            id: movement.financial_id
          }
        }).catch(err => console.log(err));

        console.log('Financeiro carregado!');
        return financial_employee;

      }

    });

    const move_users = await Promise.all(movement_users);
   
   
    res.render('payments/show.ejs', { movements, move_users, payment_condition, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files, modal: modal });

  
});


router.get('/payment/download/:arquivo', adminAuth, (req, res) => {
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

router.get('/payments', adminAuth, (req, res) => {

  var message = req.flash('success');
  message = (message == undefined || message.length == 0) ? '' : message;

  Supplier.findAll({}).then(suppliers => {

    Company.findAll({
      where: {
        name: {
          [Op.like]: `% ${req.session.user.unit.city.toUpperCase()}%`
        }
      }
    }).then(companies => {

        res.render('payments/index.ejs', { user: req.session.user, suppliers: suppliers, companies: companies, message: message });

    });

  }).catch(error => {
    console.error('Error retrieving suppliers:', error);
  });
});

router.post('/upload/payments', upload.array('files'), adminAuth, async (req, res) => {
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

  const payment_condition = req.body.payment_condition;
  console.log("payment_condition: " + payment_condition);
  const amount_parcelable = req.body.amount_parcelable;
  console.log("amount_parcelable: " + amount_parcelable);


  const files = req.files;

  var dateFormat = expiration.split("/").reverse().join("-");
  console.log("dataFormata: " + dateFormat);



  if (req.session.user.profile.description == 'managers' ||
    req.session.user.profile.description == 'purchases' ||
    req.session.user.profile.description == 'financial' ||
    req.session.user.profile.description == 'ti' ||
    req.session.user.profile.description == 'marketing' ||
    req.session.user.profile.description == 'rh' ||
    req.session.user.profile.description == 'sac' ||
    req.session.user.profile.description == 'sau' 

  ) {

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
  
    const newPayment_Method = await Payment_Method.create({
  
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
  
    await Payment_Condition.create({
      type_condition: payment_condition,
      amount_parcelable: amount_parcelable,
      payment_method_id: newPayment_Method.id
    }).catch(error => {
      console.error('Error creating payment_condition:', error);
    });
  

    await Movement.create({

      employee_id: req.session.user.employee.id,
      payment_id: newPayment.id,

    }).catch(err => console.log(err));

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

  // Fetch all directors asynchronously
  const leaders = await Profile.findAll({
    where: {
      description: 'leaders'
    }
  }).catch(err => console.log(err));

  // Now you can use map on the directors array
  const leaderLoginsPromises = leaders.map(async (leader) => {
    let user = await User.findOne({
      where: {
        profile_id: leader.id
      }
    });
    return user.login; // Return the user's login
  });

  // Wait for all director logins to be fetched
  const leaderLogins = await Promise.all(leaderLoginsPromises);

  // Combine all emails into a single array
  const emails = [req.session.user.employee.email, ...leaderLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {
 
    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${newPayment.id}`;
    let text = "Nova solicitação de pagamento gerada.";
    let mail_employee = "Gerente: " + req.session.user.employee.name;
    let mail_email =  "E-mail: " + req.session.user.employee.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };
    

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  } else if (req.session.user.profile.description == 'leaders') {

    const newPayment = await Payment.create({
      /*where: {
        employee_id: req.session.user.employee.id
      },*/
      description: description,
      value: value,
      expiration_date: dateFormat,
      leader_id: req.session.user.employee.id,
      status: 'Em análise pelo diretor',
      employee_id: req.session.user.employee.id,
      supplier_id: supplier,
      company_id: company
  
    }).catch(error => {
      console.error('Error creating payment:', error);
    });
  
    const newPayment_Method = await Payment_Method.create({
  
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
  
    await Payment_Condition.create({
      type_condition: payment_condition,
      amount_parcelable: amount_parcelable,
      payment_method_id: newPayment_Method.id
    }).catch(error => {
      console.error('Error creating payment_condition:', error);
    });
  

    await Movement.create({

      leader_id: req.session.user.employee.id,
      payment_id: newPayment.id,
      status: 'Em análise pelo diretor',

    }).catch(err => console.log(err));

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

  // Fetch all directors asynchronously
  const directors = await Profile.findAll({
    where: {
      description: 'directors'
    }
  });

  // Now you can use map on the directors array
  const directorLoginsPromises = directors.map(async (director) => {
    let user = await User.findOne({
      where: {
        profile_id: director.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  });

  // Wait for all director logins to be fetched
  const directorLogins = await Promise.all(directorLoginsPromises);

  // Combine all emails into a single array
  const emails = [req.session.user.employee.email, ...directorLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${newPayment.id}`;
    let text = "Nova solicitação de pagamento gerada.";
    let mail_employee = "Gestor(a): " + req.session.user.employee.name;
    let mail_email =  "E-mail: " + req.session.user.employee.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  } else if (req.session.user.profile.description == 'directors') {

    const newPayment = await Payment.create({
      /*where: {
        employee_id: req.session.user.employee.id
      },*/
      description: description,
      value: value,
      expiration_date: dateFormat,
      director_id: req.session.user.employee.id,
      status: 'Em análise pelo compras',
      employee_id: req.session.user.employee.id,
      supplier_id: supplier,
      company_id: company
  
    }).catch(error => {
      console.error('Error creating payment:', error);
    });
  
    const newPayment_Method = await Payment_Method.create({
  
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
  
    await Payment_Condition.create({
      type_condition: payment_condition,
      amount_parcelable: amount_parcelable,
      payment_method_id: newPayment_Method.id
    }).catch(error => {
      console.error('Error creating payment_condition:', error);
    });
  


    await Movement.create({

      director_id: req.session.user.employee.id,
      payment_id: newPayment.id,
      status: 'Em análise pelo compras',

    }).catch(err => console.log(err));

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

  // Fetch all directors asynchronously
  const purchase = await Profile.findAll({
    where: {
      description: 'purchases'
    }
  }).catch(err => console.log(err));

  // Now you can use map on the directors array
  const purchaseLoginsPromises = purchase.map(async (compras) => {
    let user = await User.findOne({
      where: {
        profile_id: compras.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  });

  // Wait for all director logins to be fetched
  const purchaseLogins = await Promise.all(purchaseLoginsPromises);

  // Combine all emails into a single array
  const emails = [req.session.user.employee.email, ...purchaseLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${newPayment.id}`;
    let text = "Nova solicitação de pagamento gerada.";
    let mail_employee = "Diretor(a): " + req.session.user.employee.name;
    let mail_email =  "E-mail: " + req.session.user.employee.email; 
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });


  } 

  req.flash('success', 'Solicitação de pagamento gerada com sucesso!')
  res.redirect('/payments');

});

module.exports = router;
