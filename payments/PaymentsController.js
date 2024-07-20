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


let transporter = nodemailer.createTransport({
  host: 'mail.provida.med.br', // Substitua pelo endereço do seu servidor SMTP
  port: 587, // Substitua pela porta do seu servidor SMTP
  secure: false, // Use TLS ou SSL
  auth: {
    user: 'nao-responda@provida.med.br', // Substitua pelo seu email corporativo
    pass: 'HJ^c+4_gAwiF' // Substitua pela senha do seu email corporativo
  }
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

  const payment = await Payment.findByPk(id);
  const manager = await Employee.findByPk(payment.employee_id);
  const leader = await Employee.findByPk(payment.leader_id);
  const director = await Employee.findByPk(payment.director_id);
  const purchase = await Employee.findByPk(payment.purchase_id);
  const financial = await Employee.findByPk(req.session.user.employee.id);

  const emails = [manager.email, leader.email, director.email, purchase.email, financial.email];


  await Movement.create({

    financial_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'APROVADO'

  });



  // Send emails to all recipients
  emails.forEach(async (email) => {

    console.log("Email: " + email);

    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Finaceiro efetuou o pagamento.\n"
      + "\n\n Colaborador(a): " + financial.name +
      "\n E-mail: " + financial.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
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


  res.redirect('/dashboard/pending?success=true');

});



router.get('/payment/accept/purchases/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id);
  const manager = await Employee.findByPk(payment.employee_id);
  const leader = await Employee.findByPk(payment.leader_id);
  const director = await Employee.findByPk(payment.director_id);
  const purchase = await Employee.findByPk(req.session.user.employee.id);

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

  });
  //movements

  const financial = await Profile.findAll({
    where: {
      description: 'financial'
    }
  });

  const financialLoginsPromises = financial.map(async (finance) => {
    let user = await User.findOne({
      where: {
        profile_id: finance.id
      }
    });
    return user.login; // Return the user's login
  });

  const financialLogins = await Promise.all(financialLoginsPromises);


  const emails = [manager.email, leader.email, director.email, purchase.email, ...financialLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {

    console.log("Email: " + email);

    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Compras aceitou a solicitação de pagamento.\n"
      + "\n\n Comprador(a): " + purchase.name +
      "\n E-mail: " + purchase.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });


  res.redirect('/dashboard/pending?success=true');

});

router.get('/payment/reprove/purchases/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  res.redirect(`/payments/${id}?modal=purchases`);

});

router.post('/payment/reprove/purchases', adminAuth, async (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  const payment = await Payment.findByPk(id);

  const manager = await Employee.findByPk(payment.employee_id);

  const director = await Employee.findByPk(payment.director_id);

  const leader = await Employee.findByPk(payment.leader_id);

  const purchase = await Employee.findByPk(req.session.user.employee.id);

  //const financial = await Employee.findByPk(payment.financial_id);

  const emails = [manager.email, director.email, leader.email, purchase.email];

  //movement
  await Movement.create({

    purchase_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'REPROVADO'

  });
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

    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Setor de compras recusou a solicitação de pagamento.\n"
      + "Motivo: " + motivo
      + "\n\n Comprador(a): " + purchase.name +
      "\n E-mail: " + purchase.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {

      console.log("Erro ao enviar o email: " + error);

    }


  });

  res.redirect('/dashboard?error=true');

});


router.get('/payment/accept/directors/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id);
  const manager = await Employee.findByPk(payment.employee_id);
  const leader = await Employee.findByPk(payment.leader_id);
  const director = await Employee.findByPk(req.session.user.employee.id);


  //movements
  await Movement.create({

    director_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'Em análise pelo compras',

  });
  //movements

  const purchases = await Profile.findAll({
    where: {
      description: 'purchases'
    }
  });

  const purchaseLoginsPromises = purchases.map(async (purchase) => {
    let user = await User.findOne({
      where: {
        profile_id: purchase.id
      }
    });
    return user.login; // Return the user's login
  });

  const purchaseLogins = await Promise.all(purchaseLoginsPromises);


  const emails = [manager.email, leader.email, director.email, ...purchaseLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {
    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Diretor aceitou a solicitação de pagamento.\n"
      + "\n\n Diretor(a): " + director.name +
      "\n E-mail: " + director.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
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

  res.redirect('/dashboard/pending?success=true');

  //Em análise pelo compras director_id

});

router.get('/payment/reprove/directors/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  res.redirect(`/payments/${id}?modal=directors`);


});

router.post('/payment/reprove/directors', adminAuth, async (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  const payment = await Payment.findByPk(id);

  const manager = await Employee.findByPk(payment.employee_id);

  const director = await Employee.findByPk(req.session.user.employee.id);

  const leader = await Employee.findByPk(payment.leader_id);

  //const purchase = await Employee.findByPk(req.session.user.employee.id);

  //const financial = await Employee.findByPk(payment.financial_id);

  const emails = [manager.email, leader.email, director.email];

  //movement
  await Movement.create({

    director_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'REPROVADO'

  });
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

    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Diretor recusou a solicitação de pagamento.\n"
      + "Motivo: " + motivo
      + "\n\n Diretor(a): " + director.name +
      "\n E-mail: " + director.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {

      console.log("Erro ao enviar o email: " + error);

    }

  });

  res.redirect('/dashboard?error=true');

});



router.get('/payment/accept/leaders/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id);
  const manager = await Employee.findByPk(payment.employee_id);
  const leader = await Employee.findByPk(req.session.user.employee.id);

  //movements
  await Movement.create({

    leader_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'Em análise pelo diretor'

  });
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
    });
    return user.login; // Return the user's login
  });

  // Wait for all director logins to be fetched
  const directorLogins = await Promise.all(directorLoginsPromises);

  // Combine all emails into a single array
  const emails = [manager.email, leader.email, ...directorLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {
    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor aceitou a solicitação de pagamento.\n"
      + "\n\n Diretor(a): " + leader.name +
      "\n E-mail: " + leader.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
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

  res.redirect('/dashboard/pending?success=true');
});


router.get('/payment/reprove/leaders/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  res.redirect(`/payments/${id}?modal=leaders`);

});


router.post('/payment/reprove/leaders', adminAuth, async (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  const payment = await Payment.findByPk(id);

  const manager = await Employee.findByPk(payment.employee_id);

  //const director = await Employee.findByPk(payment.director_id);

  const leader = await Employee.findByPk(req.session.user.employee.id);

  //const purchase = await Employee.findByPk(req.session.user.employee.id);

  //const financial = await Employee.findByPk(payment.financial_id);

  if (payment == undefined) {
    console.log("Payment undefinied")
  } else if (manager == undefined) {
    console.log("Manager undefinied")
  } else if (leader == undefined) {
    console.log("Leader undefinied")
  }

  //movement
  await Movement.create({

    leader_id: req.session.user.employee.id,
    payment_id: payment.id,
    status: 'REPROVADO'

  });
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

    console.log("Email: " + email);

    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor recusou a solicitação de pagamento.\n"
      + "Motivo: " + motivo
      + "\n\n Diretor(a): " + leader.name +
      "\n E-mail: " + leader.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {

      console.log("Erro ao enviar o email: " + error);

    }

  });

  res.redirect('/dashboard?error=true');

});



router.get('/payments/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const payment = await Payment.findByPk(id);


  if (payment.leader_id != null) {

    console.log("leader_id: " + payment.leader_id);
    leader_employee = await Employee.findByPk(payment.leader_id);

  }

  if (payment.director_id != null) {

    director_employee = await Employee.findByPk(payment.director_id);

  }

  if (payment.purchase_id != null) {

    purchase_employee = await Employee.findByPk(payment.purchase_id);

    console.log("purchase_employee: " + purchase_employee)


  }

  if (payment.financial_id != null) {

    financial_employee = await Employee.findByPk(payment.financial_id);

  }

  const employee = await Employee.findByPk(payment.employee_id);
  const supplier = await Supplier.findByPk(payment.supplier_id);
  const sector = await Sector.findByPk(employee.sector_id);
  const unit = await Unit.findByPk(employee.unit_id);
  const payment_method = await Payment_Method.findByPk(payment.id);
  const payment_condition = await Payment_Condition.findOne({
    where: {
      payment_method_id: payment_method.id
    }
  });
  const company = await Company.findByPk(payment.company_id);


  const files = await File.findAll({
    where: {
      payment_id: payment.id
    }
  });

  if (payment == undefined) {
    console.log("Payment undefinied")
  } else if (employee == undefined) {
    console.log("Employee undefinied")
  } else if (supplier == undefined) {
    console.log("Supplier undefinied")
  } else if (sector == undefined) {
    console.log("Sector undefinied")
  } else if (unit == undefined) {
    console.log("Unit undefinied")
  } else if (payment_method == undefined) {
    console.log("Payment_method undefinied")
  } else if (company == undefined) {
    console.log("Company undefinied")
  } else if (payment_condition == undefined) {
    console.log("Payment_condition undefinied")
  }


    const movements = await Movement.findAll({
      where: {
        payment_id: payment.id
      }
    });

    if (movements == undefined) {
      console.log("Movements undefinied")

    }

     const movement_users =  movements.map(async (movement) => {

    /*  if (movement.employee_id != undefined) {

       let manager_employee = await Employee.findOne({
          where: {
            id: movement.employee_id
          }
        });
        console.log('Gerente carregado!')
        return manager_employee; 

      } else */
       if (movement.leader_id != undefined) {

       let leader_employee = await Employee.findOne({
          where: {
            id: movement.leader_id
          }
        });

        console.log('Gestor carregado!');
        return leader_employee;
       
      } else if (movement.director_id != undefined) {

       let director_employee = await Employee.findOne({
          where: {
            id: movement.director_id
          }
        });

        console.log('Diretor carregado!');
        return director_employee;
    
      } else if (movement.purchase_id != undefined) {

        let purchase_employee = await Employee.findOne({
          where: {
            id: movement.purchase_id
          }
        });
        console.log('Compras carregado!');
        return purchase_employee;

      } else if (movement.financial_id != undefined) {

       let financial_employee = await Employee.findOne({
          where: {
            id: movement.financial_id
          }
        });
        console.log('Financeiro carregado!');
        return financial_employee;

      }

    });

    const move_users = await Promise.all(movement_users);
   
  if (req.query.modal == 'leaders') {

    res.render('payments/show.ejs', { movements, move_users, payment_condition, leader_employee, director_employee, purchase_employee, financial_employee, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files, modal: 'leaders' });

  } else if (req.query.modal == 'directors') {

    res.render('payments/show.ejs', { movements, move_users, payment_condition, leader_employee, director_employee, purchase_employee, financial_employee, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files, modal: 'leaders' });
    res.render('payments/show.ejs', { movements, move_users, payment_condition, leader_employee, director_employee, purchase_employee, financial_employee, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files, modal: 'directors' });

  } else if (req.query.modal == 'purchases') {

    res.render('payments/show.ejs', { movements, move_users, payment_condition, leader_employee, director_employee, purchase_employee, financial_employee, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files, modal: 'purchases' });

  } else {

    res.render('payments/show.ejs', { movements, move_users, payment_condition, leader_employee, director_employee, purchase_employee, financial_employee, user: req.session.user, payment: payment, employee: employee, supplier: supplier, sector: sector, unit: unit, payment_method: payment_method, company: company, files: files, modal: '' });

  }

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

  Supplier.findAll({}).then(suppliers => {

    Company.findAll({
      where: {
        name: {
          [Op.like]: `% ${req.session.user.unit.city.toUpperCase()}%`
        }
      }
    }).then(companies => {

      if (req.query.success) {
        let message = "Solicitação de pagamento gerada com sucesso!";
        res.render('payments/index.ejs', { user: req.session.user, suppliers: suppliers, companies: companies, message: message });

      } else {
        res.render('payments/index.ejs', { user: req.session.user, suppliers: suppliers, companies: companies, message: '' });

      }



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

  const newUser = await User.findOne({
    where: {
      employee_id: newPayment.employee_id
    }
  });

  const newProfile = await Profile.findOne({
    where: {
      id: newUser.profile_id
    }
  });
/*
  if (newProfile.description == 'managers') {

    await Movement.create({

      employee_id: req.session.user.employee.id,
      payment_id: newPayment.id,

    });

  } else if (newProfile.description == 'leaders') {


    await Movement.create({

      leader_id: req.session.user.employee.id,
      payment_id: newPayment.id,
      status: 'Em análise pelo diretor',

    });


  } else if (newProfile.description == 'directors') {

    await Movement.create({

      director_id: req.session.user.employee.id,
      payment_id: newPayment.id,
      status: 'Em análise pelo compras',

    });

  } else if (newProfile.description == 'purchases') {

    await Movement.create({

      purchase_id: req.session.user.employee.id,
      payment_id: newPayment.id,
      status: 'Pagamento em andamento',

    });

  } else if (newProfile.description == 'financial') {

    await Movement.create({

      financial_id: req.session.user.employee.id,
      payment_id: newPayment.id,
      status: 'APROVADO',

    });


  }*/


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
  });

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
    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${newPayment.id}`;
    let text = "Nova solicitação de pagamento gerada.\n"
      + "\n\n Gerente: " + req.session.user.employee.name +
      "\n E-mail: " + req.session.user.employee.email +
      "\n\n Acesse: http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      text
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  res.redirect('/payments/?success=true');

});

module.exports = router;
