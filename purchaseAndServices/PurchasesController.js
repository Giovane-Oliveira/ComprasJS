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
const nodemailer = require('nodemailer');
const Profile = require('../users/Profile');
const User = require('../users/User');
const Movement = require('../movements/Movement');
const pug = require('pug');

let transporter = nodemailer.createTransport({
  host: 'mail.provida.med.br', // Substitua pelo endereço do seu servidor SMTP
  port: 587, // Substitua pela porta do seu servidor SMTP
  secure: false, // Use TLS ou SSL
  auth: {
    user: 'nao-responda@provida.med.br', // Substitua pelo seu email corporativo
    pass: 'FRbHXf=YBV}E' // Substitua pela senha do seu email corporativo
  }
});

/*
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
      pass: 'AdminPV@2024' // Substitua pela senha do seu email corporativo
  },
  debug: true,
  logger:true
}); 
*/

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

//Encaminhar para a página de solicitações de compras
router.get('/purchases', adminAuth, (req, res) => {

  var message = req.flash('success');
  message = (message.length == 0 || message == undefined) ? '' : message;

  res.render('purchaseAndServices/index.ejs', { user: req.session.user, message: message });

});

//Revisão do orçamento da solicitação do compras, somente por este perfil
router.post('/upload/purchases/revision_orcament', adminAuth, upload.array('files'), async (req, res) => {

  const files = req.files;
  var item = req.body.newitem1;
  var value = req.body.newvalue1;

  var count = 1;
  var total = 0.00;

  const purchase = await Purchase.findByPk(req.body.purchase_id).catch(err => console.log(err));
  const manager = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(purchase.leader_id).catch(err => console.log(err));
  const purchases = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  while (item != undefined && value != undefined) {

    let valorF = req.body['newvalue' + count].replace('.', ' ').replace('R$', '');
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
    value = req.body['newvalue' + count];

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

      let valorF = req.body['newvalue' + count].replace('.', ' ').replace('R$', '');
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
        {
          where: {
            purchase_id: req.body.purchase_id,
            amount: req.body['newamount' + count],
            item: req.body['newitem' + count],
            description: req.body['newdescription' + count]
          }

        }).catch(err => console.log("Erro aqui:" + err));

    }

    count++;
    item = req.body['newitem' + count];

  }

  // Check if any files were uploaded
  if (files && files.length > 0) {
    // Processar os dados e o arquivo aqui
    //console.log(`Nome: ${nome}`);

    //deletar arquivo
    const archives = await File.findAll({
      where: {
        purchase_id: req.body.purchase_id
      }
    }).catch(err => console.log(err));

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

  const director = await Profile.findAll({
    where: {
      description: 'directors'
    }
  }).catch(err => console.log(err));

  const directorsLoginsPromises = director.map(async (dir) => {
    let user = await User.findOne({
      where: {
        profile_id: dir.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  });

  const directorLogins = await Promise.all(directorsLoginsPromises);

  const emails = [manager.email, leader.email, purchases.email, ...directorLogins];

  //movements
  await Movement.create({

    purchase_id: req.session.user.employee.id,
    purchases_id: purchase.id,
    status: 'Em análise pelo diretor'

  }).catch(err => console.log(err));
  //movements

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${req.body.purchase_id}`;
    let text = "Compras aceitou a solicitação de compras/serviços.";
    let mail_employee = "Comprador(a): " + purchases.name;
    let mail_email =  "E-mail: " + purchases.email; 
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

  req.flash('success', 'Solicitação revisada com sucesso');
  res.redirect('/dashboard/pending');

});

//Encaminhamento para a tela de revisão da solicitação
router.get('/revision_orcament/:id', adminAuth, async (req, res) => {
  
  const id = req.params.id;
  var leader_employee = null;
  var director_employee = null;
  var financial_employee = null;
  var purchase_employee = null;

  const purchase = await Purchase.findByPk(id).catch(err => console.log(err));

  if (purchase.leader_id != null) {

    leader_employee = await Employee.findByPk(purchase.leader_id).catch(err => console.log(err));

  }

  if (purchase.director_id != null) {

    director_employee = await Employee.findByPk(purchase.director_id).catch(err => console.log(err));

  }

  if (purchase.purchase_id != null) {

    purchase_employee = await Employee.findByPk(purchase.purchase_id).catch(err => console.log(err));

  }

  if (purchase.financial_id != null) {

    financial_employee = await Employee.findByPk(purchase.financial_id).catch(err => console.log(err));

  }

  const employee = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  const item = await Item.findAll({ where: { purchase_id: purchase.id } }).catch(err => console.log(err));
  const sector = await Sector.findByPk(employee.sector_id).catch(err => console.log(err));
  const files = await File.findAll({ where: { purchase_id: purchase.id } }).catch(err => console.log(err));
  const unit = await Unit.findByPk(employee.unit_id).catch(err => console.log(err));

  res.render('purchaseAndServices/revision_orcament.ejs', { leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, items: item, sector, unit, files, user: req.session.user, purchase_id: id });

});

//Aceite da solicitação de compras pelo financeiro
router.post('/purchase/accept/financial', upload.array('files'), adminAuth, async (req, res) => {

  const id = req.body.purchase_id;
  const files = req.files;

  //movements
  await Movement.create({

    financial_id: req.session.user.employee.id,
    purchases_id: id,
    status: 'APROVADO'

  }).catch(err => console.log(err));
  //movements

  Purchase.update({

    status: 'APROVADO',
    financial_id: req.session.user.employee.id

  }, {
    where: {
      id: id
    }
  }).catch(error => {
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

  var purchase = await Purchase.findByPk(id).catch(err => console.log(err));
  var manager = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  var leader = await Employee.findByPk(purchase.leader_id).catch(err => console.log(err));
  var director = await Employee.findByPk(purchase.director_id).catch(err => console.log(err));
  var purchases = await Employee.findByPk(purchase.purchase_id).catch(err => console.log(err));
  var financial = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  var emails = [];

  if (leader == undefined && director != undefined && purchases == undefined && financial != undefined) {

    emails = [director.email, financial.email];

  } else {

    emails = [manager.email, leader.email, director.email, purchases.email, financial.email];

  }

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
        html: pug.renderFile('views/pugs/accept_requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link})
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });


  req.flash('success', 'Solicitação enviada com sucesso');
  res.redirect('/dashboard/pending');

});

//Aceite do gestor
router.get('/purchase/accept/leaders/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const purchase = await Purchase.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  //movements
  await Movement.create({

    leader_id: req.session.user.employee.id,
    purchases_id: purchase.id,
    status: 'Em análise pelo compras'

  }).catch(err => console.log(err));
  //movements

  // Fetch all directors asynchronously
  const purchases = await Profile.findAll({
    where: {
      description: 'purchases'
    }
  }).catch(err => console.log(err));

  // Now you can use map on the directors array
  const purchaseLoginsPromises = purchases.map(async (purchase) => {
    let user = await User.findOne({
      where: {
        profile_id: purchase.id
      }
    }).catch(err => console.log(err));
    return user.login; // Return the user's login
  })

  // Wait for all director logins to be fetched
  const purchaseLogins = await Promise.all(purchaseLoginsPromises);

  // Combine all emails into a single array
  const emails = [manager.email, leader.email, ...purchaseLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {
 
    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor aceitou a solicitação de compras.";
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

  // Update purchase status
  Purchase.update({
    status: 'Em análise pelo compras',
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

  req.flash('success', 'Solicitação aprovada com sucesso');
  res.redirect('/dashboard/pending');

});

//Encaminhamento para visualização após reprovação do Gestor
router.get('/purchase/reprove/leaders/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  req.flash('modal', 'leaders');
  res.redirect(`/purchases/${id}`);

});

//Reprovação da solicitação pelo Gestor
router.post('/purchase/reprove/leaders', adminAuth, async (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  const purchase = await Purchase.findByPk(id).catch(err => console.log(err));

  const manager = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));

  //const director = await Employee.findByPk(payment.director_id);

  const leader = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));

  //const purchase = await Employee.findByPk(req.session.user.employee.id);

  //const financial = await Employee.findByPk(payment.financial_id);

  if (purchase == undefined) {
    console.log("Purchase undefinied")
  } else if (manager == undefined) {
    console.log("Manager undefinied")
  } else if (leader == undefined) {
    console.log("Leader undefinied")
  }

  //movement
  await Movement.create({

    leader_id: req.session.user.employee.id,
    purchases_id: purchase.id,
    status: 'REPROVADO'

  }).catch(err => console.log(err));
  //movement


  const emails = [manager.email, leader.email];

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

  emails.forEach(async (email) => {

    console.log("Email: " + email);

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor recusou a solicitação de compras/serviços.";
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

//Aceite da solicitação pelo Diretor
router.get('/purchase/accept/directors/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const purchase = await Purchase.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  const leader = await Employee.findByPk(purchase.leader_id).catch(err => console.log(err));
  const director = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));
  const purchases = await Employee.findByPk(purchase.purchase_id).catch(err => console.log(err));

  //movements
  await Movement.create({

    director_id: req.session.user.employee.id,
    purchases_id: purchase.id,
    status: 'Pagamento em andamento'

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


  const emails = [manager.email, leader.email, director.email, purchases.email, ...financialLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Diretor(a) aceitou a solicitação de compras/serviços.";
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

  req.flash('success', 'Solicitação aprovada com sucesso');
  res.redirect('/dashboard/pending');

});

//Encaminhamento para visualização após reprovação do Diretor
router.get('/purchase/reprove/directors/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  req.flash('modal', 'directors');
  res.redirect(`/purchases/${id}`)

});

//Reprovação do Diretor
router.post('/purchase/reprove/directors', adminAuth, async (req, res) => {

  const id = req.body.id;
  const motivo = req.body.motivo;
  console.log("Motivo:" + motivo);

  const purchase = await Purchase.findByPk(id).catch(err => console.log(err));
  const manager = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  const director = await Employee.findByPk(req.session.user.employee.id).catch(err => console.log(err));
  const leader = await Employee.findByPk(purchase.leader_id).catch(err => console.log(err));
  const purchases = await Employee.findByPk(purchase.purchase_id).catch(err => console.log(err));

  //movement
  await Movement.create({

    director_id: req.session.user.employee.id,
    purchases_id: purchase.id,
    status: 'REPROVADO'

  }).catch(err => console.log(err));
  //movement

  var emails = [];

  if (manager.email == leader.email) {
    emails = [leader.email, director.email, purchases.email];
  } else {
    emails = [leader.email, director.email, purchases.email];
  }

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

  emails.forEach(async (email) => {

    let from = "suporte.ti@grupoprovida.com.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Diretor(a) recusou a solicitação de compras/serviços.";
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

//Download dos arquivos da solicitação
router.get('/purchase/download/:arquivo', adminAuth, (req, res) => {
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

//Assinatura email
router.get('/file/download/assinatura', (req, res) => {
  // Obter o nome do arquivo
  const fileName = 'logo.png';
  const filePath = `public/images/${fileName}`;

  // Verificar se o arquivo existe
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Arquivo não encontrado!');
    return;
  }

  // Enviar o arquivo como download
  res.header('Content-Disposition', `inline; filename="${fileName}"`);
  res.sendFile(fileName, { root: 'public/images' });
});

//Exibir solicitações de compras e serviços
router.get('/purchases/:id', adminAuth, async (req, res) => {
  const id = req.params.id;
  var leader_employee = null;
  var director_employee = null;
  var financial_employee = null;
  var purchase_employee = null;

  const purchase = await Purchase.findByPk(id).catch(err => console.log(err));

  if (purchase.leader_id != null) {

    leader_employee = await Employee.findByPk(purchase.leader_id).catch(err => console.log(err));

  }

  if (purchase.director_id != null) {

    director_employee = await Employee.findByPk(purchase.director_id).catch(err => console.log(err));

  }

  if (purchase.purchase_id != null) {

    purchase_employee = await Employee.findByPk(purchase.purchase_id).catch(err => console.log(err));

  }

  if (purchase.financial_id != null) {

    financial_employee = await Employee.findByPk(purchase.financial_id).catch(err => console.log(err));

  }

  const employee = await Employee.findByPk(purchase.employee_id).catch(err => console.log(err));
  const item = await Item.findAll({ where: { purchase_id: purchase.id } }).catch(err => console.log(err));
  const sector = await Sector.findByPk(employee.sector_id).catch(err => console.log(err));
  const files = await File.findAll({ where: { purchase_id: purchase.id } }).catch(err => console.log(err));
  const unit = await Unit.findByPk(employee.unit_id).catch(err => console.log(err));


  const movements = await Movement.findAll({
    where: {
      purchases_id: purchase.id
    }
  }).catch(err => console.log(err));

  if (movements == undefined) {
    console.log("Movements undefinied")
  }

  const movement_users = movements.map(async (movement) => {

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

  message = req.flash('modal');

  message = (message == undefined || message.length == 0) ? '' : message;

  res.render('purchaseAndServices/show.ejs', { movements, move_users, leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user, unit, modal: message });

});

//Gerar um nova solicitação de compras e serviços
router.post('/upload/purchases', upload.array('files'), adminAuth, async (req, res) => {

  const justification = req.body.justification;
  console.log(justification);
  const files = req.files;
  var newPurchase = undefined;

  var item = req.body.item1;
  var count = 1;
  var total = 0.00;

  while (item != undefined) {

    let valorF = req.body['totalItem' + count].replace('R$', '');
    total += parseFloat(valorF);

    count++;
    item = req.body['item' + count];

  }

  console.log("Total: " + total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

  if (req.session.user.profile.description == 'managers' || req.session.user.profile.description == 'ti'
    || req.session.user.profile.description == 'financial' || req.session.user.profile.description == 'purchases'
  || req.session.user.profile.description == 'marketing' || req.session.user.profile.description == 'rh'
|| req.session.user.profile.description == 'sac' || req.session.user.profile.description == 'sau') {

    newPurchase = await Purchase.create({
      justification: justification,
      total: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      employee_id: req.session.user.employee.id
    }).catch(err => console.log(err));

    //movements
    await Movement.create({

      employee_id: req.session.user.employee.id,
      purchases_id: newPurchase.id,
      status: 'Em análise pelo gestor'

    }).catch(err => console.log(err));
    //movements

    item = req.body.item1;
    count = 1;

    while (item != undefined) {

      console.log(req.body['amount' + count]);
      console.log(req.body['item' + count]);
      console.log(req.body['description' + count]);
      console.log(req.body['value' + count]);
      console.log(req.body['city' + count]);

      Item.create({
        amount: req.body['amount' + count],
        item: req.body['item' + count],
        description: req.body['description' + count],
        value: parseFloat(req.body['value' + count].replace('R$', ' ')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        city: req.body['city' + count],
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
      }).catch(err => console.log(err));
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
      let subject = `Solicitação #${newPurchase.id}`;
      let text = "Nova solicitação de compras/serviços gerada.";
      let mail_employee = "Gerente: " + req.session.user.employee.name;
      let mail_email =  "E-mail: " + req.session.user.employee.email;
      let mail_justification = "Justificativa: " + justification;
      let link = "http://52.156.72.125:3001";
  
      let mailOptions = {
          from,
          to,
          subject,
          html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link, justification: mail_justification})
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
      } catch (error) {
        console.log("Erro ao enviar o email: " + error);
      }
    });


  } else if (req.session.user.profile.description == 'leaders') {


    newPurchase = await Purchase.create({
      justification: justification,
      total: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      leader_id: req.session.user.employee.id,
      status: 'Em análise pelo compras',
      employee_id: req.session.user.employee.id
    }).catch(err => console.log(err));


    //movements
    await Movement.create({

      leader_id: req.session.user.employee.id,
      purchases_id: newPurchase.id,
      status: 'Em análise pelo compras'

    }).catch(err => console.log(err));
    //movements

    item = req.body.item1;
    count = 1;

    while (item != undefined) {

      console.log(req.body['amount' + count]);
      console.log(req.body['item' + count]);
      console.log(req.body['description' + count]);
      console.log(req.body['value' + count]);
      console.log(req.body['city' + count]);

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
        city: req.body['city' + count],
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


    // Fetch all directors asynchronously
    const directors = await Profile.findAll({
      where: {
        description: 'directors'
      }
    }).catch(err => console.log(err));

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
      let subject = `Solicitação #${newPurchase.id}`;
      let text = "Nova solicitação de compras/serviços gerada.";
      let mail_employee = "Gestor(a): " + req.session.user.employee.name;
      let mail_email =  "E-mail: " + req.session.user.employee.email;
      let mail_justification = "Justificativa: " + justification;
      let link = "http://52.156.72.125:3001";
  
      let mailOptions = {
          from,
          to,
          subject,
          html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link, justification: mail_justification})
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
      } catch (error) {
        console.log("Erro ao enviar o email: " + error);
      }
    });

  } else if (req.session.user.profile.description == 'directors') {


    newPurchase = await Purchase.create({
      justification: justification,
      total: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      director_id: req.session.user.employee.id,
      status: 'Pagamento em andamento',
      employee_id: req.session.user.employee.id
    }).catch(err => console.log(err));

    //movements
    await Movement.create({

      director_id: req.session.user.employee.id,
      purchases_id: newPurchase.id,
      status: 'Pagamento em andamento'

    }).catch(err => console.log(err));
    //movements

    item = req.body.item1;
    count = 1;

    while (item != undefined) {

      console.log(req.body['amount' + count]);
      console.log(req.body['item' + count]);
      console.log(req.body['description' + count]);
      console.log(req.body['value' + count]);
      console.log(req.body['city' + count]);

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
        city: req.body['city' + count],
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


    // Fetch all directors asynchronously
    const financial = await Profile.findAll({
      where: {
        description: 'financial'
      }
    }).catch(err => console.log(err));

    // Now you can use map on the directors array
    const financialLoginsPromises = financial.map(async (finance) => {
      let user = await User.findOne({
        where: {
          profile_id: finance.id
        }
      }).catch(err => console.log(err));
      return user.login; // Return the user's login
    });

    // Wait for all director logins to be fetched
    const financialLogins = await Promise.all(financialLoginsPromises);

    // Combine all emails into a single array
    const emails = [req.session.user.employee.email, ...financialLogins];

    // Send emails to all recipients
    emails.forEach(async (email) => {

      let from = "suporte.ti@grupoprovida.com.br";
      let to = email;
      let subject = `Solicitação #${newPurchase.id}`;
      let text = "Nova solicitação de compras/serviços gerada.";
      let mail_employee = "Diretor(a): " + req.session.user.employee.name;
      let mail_email =  "E-mail: " + req.session.user.employee.email;
      let mail_justification = "Justificativa: " + justification;
      let link = "http://52.156.72.125:3001";
  
      let mailOptions = {
          from,
          to,
          subject,
          html: pug.renderFile('views/pugs/requests.pug', {text: text, employee: mail_employee, email: mail_email, link: link, justification: mail_justification})
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
      } catch (error) {
        console.log("Erro ao enviar o email: " + error);
      }
    });

  }

  req.flash('success', 'Solicitação enviada com sucesso!');
  res.redirect('/purchases');

});

module.exports = router;
