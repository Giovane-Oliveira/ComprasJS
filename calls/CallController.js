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
const Call = require('../calls/Call');
const Message = require('../calls/Message');

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

let transporter = nodemailer.createTransport({
  host: 'mail.provida.med.br', // Substitua pelo endereço do seu servidor SMTP
  port: 587, // Substitua pela porta do seu servidor SMTP
  secure: false, // Use TLS ou SSL
  auth: {
    user: 'nao-responda@provida.med.br', // Substitua pelo seu email corporativo
    pass: 'HJ^c+4_gAwiF' // Substitua pela senha do seu email corporativo
  }
});

router.get('/call/dashboard', adminAuth, async (req, res) => {
  var lastCalls, lastCallsManager, departament;
  var pending, inservice, finished;
  var message = req.flash('message');

  if (req.session.user.profile.description.includes('leaders') ||
    req.session.user.profile.description.includes('directors') ||
    req.session.user.profile.description.includes('managers')) {

    pending = await Call.findAll({
      where: {
        employee_id: req.session.user.employee.id,
        [Op.or]: [
          { status: "AGUARDANDO ATENDIMENTO" },
          { status: "AGUARDANDO RESPOSTA DO SOLICITANTE" },
          { status: "AGUARDANDO RESPOSTA DE TERCEIROS" }
        ]
      }
    });

    inservice = await Call.findAll({
      where: {
        status: 'EM ATENDIMENTO',
        user_id: req.session.user.user.id
      }
    });

    finished = await Call.findAll({
      where: {
        status: 'FINALIZADO',
        user_id: req.session.user.user.id
      }
    });

    console.log("Pending: " + pending.length)

    lastCallsManager = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        limit: 6,
        where: {
          user_id: req.session.user.user.id,
        }
      }
    ).catch((err) => {
      console.log(err);
    });

  } else {

    departament = (req.session.user.profile.description == 'ti') ? 'ti' :
      (req.session.user.profile.description == 'rh') ? 'rh' :
        (req.session.user.profile.description == 'sac') ? 'sac' :
          (req.session.user.profile.description == 'financial') ? 'financial' :
            (req.session.user.profile.description == 'marketing') ? 'marketing' :
              (req.session.user.profile.description == 'purchases') ? 'purchases' :
                (req.session.user.profile.description == 'sau') ? 'sau' : undefined;

    if (departament != undefined) {

      console.log('Departamento: ' + departament);

      pending = await Call.findAll({
        where: {
          [Op.or]: [
            { departament: departament },
            { user_id: req.session.user.user.id },

          ],

          [Op.or]: [
            { status: "AGUARDANDO ATENDIMENTO" },
            { status: "AGUARDANDO RESPOSTA DO SOLICITANTE" },
            { status: "AGUARDANDO RESPOSTA DE TERCEIROS" }
          ]

        }
      });

      inservice = await Call.findAll({
        where: {
          [Op.or]: [
            { departament: departament },
            { user_id: req.session.user.user.id },

          ],
          status: 'EM ATENDIMENTO'
        }

      });

      finished = await Call.findAll({
        where: {
          [Op.or]: [
            { departament: departament },
            { user_id: req.session.user.user.id },

          ],
          status: 'FINALIZADO'
        }
      });

      lastCalls = await Call.findAll(
        {
          include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
          order: [['id', 'DESC']],
          limit: 6,
          where: {
            [Op.or]: [
              { departament: departament },
              { user_id: req.session.user.user.id },

            ]
          }
        }
      ).catch((err) => {
        console.log(err);
      });

    } else {

      console.log('Departamento Indefinido: ' + departament);

    }

  }

  if (req.session.user.profile.description.includes('leaders') ||
    req.session.user.profile.description.includes('directors') ||
    req.session.user.profile.description.includes('managers')) {

    res.render('call/dashboard', { user: req.session.user, pending: pending, inservice: inservice, finished: finished, lastCalls: lastCallsManager, message: message });

  } else {

    res.render('call/dashboard', { user: req.session.user, pending: pending, inservice: inservice, finished: finished, lastCalls: lastCalls, message: message });

  }

});


router.get('/call/sse', adminAuth, async (req, res) => {


  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  var departament;
  var pendingCount;
  var inServiceCount;
  var finishedCount;
  var call;



  const updateTableData = async () => {
    try {
      if (req.session.user.profile.description.includes('leaders') ||
        req.session.user.profile.description.includes('directors') ||
        req.session.user.profile.description.includes('managers')) {

        // Simulate data updates (replace with your actual logic)


        pendingCount = await Call.count({ where: { status: 'AGUARDANDO ATENDIMENTO', user_id: req.session.user.user.id } })

        inServiceCount = await Call.count({ where: { status: 'EM ATENDIMENTO', user_id: req.session.user.user.id } })

        finishedCount = await Call.count({ where: { status: 'FINALIZADO', user_id: req.session.user.user.id } })


        call = await Call.findAll({
          include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
          order: [['id', 'DESC']],
          limit: 6,
          where: {
            user_id: req.session.user.user.id,
          }
        });


      } else {
        departament = (req.session.user.profile.description == 'ti') ? 'ti' :
          (req.session.user.profile.description == 'rh') ? 'rh' :
            (req.session.user.profile.description == 'sac') ? 'sac' :
              (req.session.user.profile.description == 'financial') ? 'financial' :
                (req.session.user.profile.description == 'marketing') ? 'marketing' :
                  (req.session.user.profile.description == 'purchases') ? 'purchases' :
                    (req.session.user.profile.description == 'sau') ? 'sau' : undefined;


        if (departament != undefined) {


          pendingCount = await Call.count({ where: { status: 'AGUARDANDO ATENDIMENTO', departament: departament } })

          inServiceCount = await Call.count({ where: { status: 'EM ATENDIMENTO', departament: departament } })

          finishedCount = await Call.count({ where: { status: 'FINALIZADO', departament: departament } })

          call = await Call.findAll({
            include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
            order: [['id', 'DESC']],
            limit: 6,
            where: {
              [Op.or]: [
                { departament: departament },
                { user_id: req.session.user.user.id },
              ]
            }
          });


        } else {

          console.log('Departamento Indefinido: ' + departament);

        }

      }

      res.write(`data: ${JSON.stringify({ pending: pendingCount, inService: inServiceCount, finished: finishedCount, lastCalls: call })}\n\n`);

    } catch (error) {
      console.error('Error updating table data:', error);
    }

  };

  // Get initial table data
  await updateTableData();

  // Set up interval to update table data every 5 seconds
  const interval = setInterval(updateTableData, 60000);

  // Close connection on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    console.log('SSE connection closed');
  });

});




router.post('/call/reply', upload.array('files'), adminAuth, async (req, res) => {

  const message = (req.body.message) ? req.body.message : undefined;
  const call_id = req.body.id;
  const files = req.files;
  const finishcall = req.body.finishcall;
  var status = 'EM ATENDIMENTO';
  var newAttendant = req.body.newAttendant;
  const channel_service = req.body.channel_service;
  const situacao = req.body.status;

  console.log("SITUAÇÃO: " + situacao);
  console.log('channel service: ' + channel_service)

  if (message == undefined) {

    console.log("Alterando o atendente")

    await Call.update({
      attendant_id: newAttendant
    }, {
      where: {
        id: call_id
      }
    }).catch(error => console.log('Error updating call:', error));


    await Message.update({
      attendant_id: newAttendant
    }, {
      where: {
        call_id: call_id
      }
    }).catch(error => console.log('Error updating message:', error));


  } else {

    const findCall = await Call.findOne({
      where: {
        id: call_id
      }
    }).catch(error => console.log('Error finding call:', error));

    //Verifica se é o atendente
    if (req.session.user.user.id != findCall.user_id) {

      await Message.create({
        attendant_id: req.session.user.user.id,
        message: message,
        call_id: call_id
      }).catch(error => console.log('Error creating message:', error));

      const call = await Call.findOne({

        where: {
          id: call_id
        }

      });

      if(call.attendant_id != 0 && situacao != undefined){

        await Call.update(
          {
            attendant_id: req.session.user.user.id,
            status: situacao,
            channel_service: channel_service
          }, {
          where: {
            id: call_id
          }
        }).catch(error => console.log('Error updating call:', error));

      }
      
      if(call.attendant_id == 0 && finishcall != 'on'){

        await Call.update(
          {
            attendant_id: req.session.user.user.id,
            status: 'EM ATENDIMENTO',
            channel_service: channel_service
          }, {
          where: {
            id: call_id
          }
        }).catch(error => console.log('Error updating call:', error));

      }else if(call.attendant_id != 0 && finishcall == 'on'){

        await Call.update(
          {
            attendant_id: req.session.user.user.id,
            status: 'FINALIZADO',
            channel_service: channel_service
          }, {
          where: {
            id: call_id
          }
        }).catch(error => console.log('Error updating call:', error));

      }

      const newCall = await Call.findOne({
        where: {
          id: call_id
        }
      }).catch(error => console.log('Error updating call:', error));

      const newPersonRequest = await Employee.findOne({
        where: {
          id: newCall.employee_id
        }
      });


      if (newCall.active_mail == 1) {

        let situation = 'Respondido';

        if (status == 'FINALIZADO') {

          situation = 'Finalizado';

        }

        let from = "nao-responda@provida.med.br";
        let to = newPersonRequest.email;
        let subject = `Chamado ${situation} #${call_id}`;
        let text = "Resposta: " + message;
        let mail_employee = "Atendente: " + req.session.user.employee.name;
        let mail_email = "E-mail: " + req.session.user.employee.email;
        let link = "http://52.156.72.125:3001";

        let mailOptions = {
          from,
          to,
          subject,
          html: pug.renderFile('views/pugs/accept_requests.pug', { text: text, employee: mail_employee, email: mail_email, link: link })
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log('Email sent successfully!');
        } catch (error) {
          console.log("Erro ao enviar o email: " + error);
        }

      }

      //solicitante
    } else if (req.session.user.user.id == findCall.user_id) {

      await Message.create({
        sender_id: req.session.user.user.id,
        message: message,
        call_id: call_id
      }).catch(error => console.log('Error creating message:', error));

      let situation = 'Respondido';

      if (status == 'FINALIZADO') {

        situation = 'Finalizado';

      }

      const newCall = await Call.findOne({
        where: {
          id: call_id
        }
      }).catch(error => console.log('Error updating call:', error));

      const newPersonRequest = await Employee.findOne({
        where: {
          id: newCall.attendant_id
        }
      });

      if (newPersonRequest != undefined) {

        let from = "nao-responda@provida.med.br";
        let to = newPersonRequest.email;
        let subject = `Chamado ${situation} #${call_id}`;
        let text = "Resposta: " + message;
        let mail_employee = "Solicitante: " + req.session.user.employee.name;
        let mail_email = "E-mail: " + req.session.user.employee.email;
        let link = "http://52.156.72.125:3001";

        let mailOptions = {
          from,
          to,
          subject,
          html: pug.renderFile('views/pugs/accept_requests.pug', { text: text, employee: mail_employee, email: mail_email, link: link })
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log('Email sent successfully!');
        } catch (error) {
          console.log("Erro ao enviar o email: " + error);
        }

      }



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
          call_id: call_id,
          user_id: req.session.user.user.id
        }).catch(error => {
          console.error('Error creating file:', error);
        });

      }
    } else {
      console.error('No files were uploaded.');
    }

  }
  req.flash('message', 'Reposta enviada com sucesso!');
  res.redirect('/call/dashboard');

});


router.get('/call/pending', adminAuth, async (req, res) => {

  var callPending, departament;


  if (req.session.user.profile.description.includes('leaders') ||
    req.session.user.profile.description.includes('directors') ||
    req.session.user.profile.description.includes('managers')) {

    callPending = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        where: {
          employee_id: req.session.user.employee.id,
          [Op.or]: [
            { status: "AGUARDANDO ATENDIMENTO" },
            { status: "AGUARDANDO RESPOSTA DO SOLICITANTE" },
            { status: "AGUARDANDO RESPOSTA DE TERCEIROS" }
          ]
        }
      }
    ).catch((err) => {
      console.log(err);
    });

  } else {

    departament = (req.session.user.profile.description == 'ti') ? 'ti' :
      (req.session.user.profile.description == 'rh') ? 'rh' :
        (req.session.user.profile.description == 'sac') ? 'sac' :
          (req.session.user.profile.description == 'financial') ? 'financial' :
            (req.session.user.profile.description == 'marketing') ? 'marketing' :
              (req.session.user.profile.description == 'purchases') ? 'purchases' :
                (req.session.user.profile.description == 'sau') ? 'sau' : undefined;

    console.log('Departamento: ' + departament);

    //chamados AGUARDANDO ATENDIMENTO
    callPending = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        where: {
          [Op.or]: [
            { departament: departament },
            { user_id: req.session.user.user.id }
          ],
          [Op.or]: [
            { status: "AGUARDANDO ATENDIMENTO" },
            { status: "AGUARDANDO RESPOSTA DO SOLICITANTE" },
            { status: "AGUARDANDO RESPOSTA DE TERCEIROS" }
          ]

        }


      }
    ).catch((err) => {
      console.log(err);
    });
  }

  res.render('call/status', { user: req.session.user, calls: callPending, tipo: 'AGUARDANDO ATENDIMENTO' });

});

router.get('/call/inservice', adminAuth, async (req, res) => {
  var callInService, departament;


  if (req.session.user.profile.description.includes('leaders') ||
    req.session.user.profile.description.includes('directors') ||
    req.session.user.profile.description.includes('managers')) {

    callInService = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        where: {
          status: 'EM ATENDIMENTO',
          employee_id: req.session.user.user.id,
        }
      }
    ).catch((err) => {
      console.log(err);
    });

  } else {

    departament = (req.session.user.profile.description == 'ti') ? 'ti' :
      (req.session.user.profile.description == 'rh') ? 'rh' :
        (req.session.user.profile.description == 'sac') ? 'sac' :
          (req.session.user.profile.description == 'financial') ? 'financial' :
            (req.session.user.profile.description == 'marketing') ? 'marketing' :
              (req.session.user.profile.description == 'purchases') ? 'purchases' :
                (req.session.user.profile.description == 'sau') ? 'sau' : undefined;

    console.log('Departamento: ' + departament);

    //chamados EM ATENDIMENTO
    callInService = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        where: {
          [Op.or]: [
            { departament: departament },
            { user_id: req.session.user.user.id },
          ],
          status: 'EM ATENDIMENTO'
        }
      }
    ).catch((err) => {
      console.log(err);
    });
  }

  res.render('call/status', { user: req.session.user, calls: callInService, tipo: 'em Atendimento' });

});

router.get('/call/finished', adminAuth, async (req, res) => {

  var callFinished, departament;


  if (req.session.user.profile.description.includes('leaders') ||
    req.session.user.profile.description.includes('directors') ||
    req.session.user.profile.description.includes('managers')) {

    callFinished = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        where: {
          status: 'FINALIZADO',
          employee_id: req.session.user.user.id,
        }
      }
    ).catch((err) => {
      console.log(err);
    });

  } else {

    departament = (req.session.user.profile.description == 'ti') ? 'ti' :
      (req.session.user.profile.description == 'rh') ? 'rh' :
        (req.session.user.profile.description == 'sac') ? 'sac' :
          (req.session.user.profile.description == 'financial') ? 'financial' :
            (req.session.user.profile.description == 'marketing') ? 'marketing' :
              (req.session.user.profile.description == 'purchases') ? 'purchases' :
                (req.session.user.profile.description == 'sau') ? 'sau' : undefined;

    console.log('Departamento: ' + departament);

    //chamados FINALIZADOS
    callFinished = await Call.findAll(
      {
        include: [{ model: User, as: 'user' }, { model: Employee, as: 'employee' }],
        order: [['id', 'DESC']],
        where: {
          [Op.or]: [
            { departament: departament },
            { user_id: req.session.user.user.id }
          ],
          status: 'FINALIZADO'
        }
      }
    ).catch((err) => {
      console.log(err);
    });
  }

  res.render('call/status', { user: req.session.user, calls: callFinished, tipo: 'Finalizados' });

});


router.post('/call/create/call', upload.array('files'), adminAuth, async (req, res) => {

  const departament = req.body.departament;
  const priority = req.body.priority;
  const category = req.body.category;
  const subject = req.body.subject;
  const message = req.body.message;
  const user_id = req.session.user.user.id;
  const employee_id = req.session.user.employee.id;
  const files = req.files;
  const mail = (req.body.subscribe == 'on') ? 1 : 0;

  console.log("Departament: " + departament);
  console.log("Priority: " + priority);
  console.log("Category: " + category);
  console.log("Subject: " + subject);
  console.log("Message: " + message);
  console.log("Checkbox: " + mail);

  const newCall = await Call.create({
    active_mail: mail,
    departament: departament,
    category: category,
    subject: subject,
    priority: priority,
    attendant_id: 0,
    status: 'AGUARDANDO ATENDIMENTO',
    user_id: user_id,
    employee_id: employee_id
  })
    .catch(error => {
      console.error('Error creating call:', error);
    });

  await Message.create({
    sender_id: user_id,
    message: message,
    call_id: newCall.id
  }).catch(error => {
    console.error('Error creating message:', error);
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

      File.create({
        fileName: uniqueFileName,
        call_id: newCall.id,
        user_id: req.session.user.user.id
      }).catch(error => {
        console.error('Error creating file:', error);
      });

    }
  } else {
    console.error('No files were uploaded.');
  }


  const newProfile = await Profile.findOne({
    where: {
      description: departament
    }
  });

  const emails = await User.findAll({
    where: {
      profile_id: newProfile.id
    }
  });

  emails.forEach(email => {

    console.log("Login: " + email.login);
  });

  // Send emails to all recipients
  emails.forEach(async (email) => {

    let from = "nao-responda@provida.med.br";
    let to = email.login;
    let subject = `Chamado #${newCall.id}`;
    let text = "Novo chamado gerado.";
    let mail_employee = "Solicitante: " + req.session.user.employee.name;
    let mail_email = "E-mail: " + req.session.user.employee.email;
    let link = "http://52.156.72.125:3001";

    let mailOptions = {
      from,
      to,
      subject,
      html: pug.renderFile('views/pugs/accept_requests.pug', { text: text, employee: mail_employee, email: mail_email, link: link })
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.log("Erro ao enviar o email: " + error);
    }
  });

  req.flash('message', 'Chamado criado com sucesso!')
  res.redirect('/call/dashboard');

});


router.get('/call/create', adminAuth, async (req, res) => {

  const departaments = [{ name: 'SAC', profile: 'sac' }, { name: 'T.I', profile: 'ti' }, { name: 'RH', profile: 'rh' },
  { name: 'FINANCEIRO', profile: 'financial' }, { name: 'MARKETING', profile: 'marketing' }, { name: 'COMPRAS', profile: 'purchases' }
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

  res.render('call/create', {
    user: req.session.user, departaments: departaments, ti_categories: ti_categories,
    financial_categories: financial_categories, marketing_categories: marketing_categories,
    purchases_categories: purchases_categories, rh_categories: rh_categories, sac_categories: sac_categories
  });

});

router.get('/call/show/:id', adminAuth, async (req, res) => {
  var attendant;
  var sender;
  var employeeNames;

  const call = await Call.findOne({
    where: {
      id: req.params.id
    }
  });

  if (call.attendant_id != 0) {

    let usuario = await User.findOne({
      where: {
        id: call.attendant_id
      }
    });

    let funcionario = await Employee.findOne({
      where: {
        id: usuario.employee_id
      }
    });

    attendant = { user: usuario, employee: funcionario };

    // Find all users with the same profile as the attendant
    const usersWithSameProfile = await User.findAll({
      where: {
        profile_id: attendant.user.profile_id
      }
    });

    // Get the names of the employees associated with those users
    employeeNames = await Promise.all(
      usersWithSameProfile.map(async user => {
        const employee = await Employee.findOne({
          where: {
            id: user.employee_id
          }
        });
        return employee ? { name: employee.name, id: employee.id } : null; // Return null if no employee found
      })
    );

    // Now you have an array of employee names in `employeeNames`
    console.log("Employees with the same profile as the attendant:", employeeNames);

  }

  const user = await User.findOne({
    where: {
      id: call.user_id
    }
  }).catch((err) => {
    console.log("Error User " + err);
  });

  const employee = await Employee.findOne({
    where: {
      id: user.employee_id
    }
  }).catch((err) => {
    console.log("Error Employee " + err);
  });

  const sector = await Sector.findOne({
    where: {
      id: employee.sector_id
    }
  }).catch((err) => {
    console.log("Error Sector " + err);
  });

  const unit = await Unit.findOne({
    where: {
      id: employee.unit_id
    }
  }).catch((err) => {
    console.log("Error Unit " + err);
  });

  const files = await File.findAll({
    where: {
      call_id: req.params.id
    }
  }).catch((err) => {
    console.log("Error File " + err);
  });

  //console.log("Files Total: " + files.length);

  const messageFirst = await Message.findOne({
    where: {
      call_id: req.params.id
    }
  });

  const messageAll = await Message.findAll({
    where: {
      call_id: req.params.id
    }
  }).catch(err => console.log("Message All Err " + err));

  sender = { user: user, employee: employee };


  if (employeeNames != undefined) {
    res.render('call/show', {
      user: req.session.user, call: call, employee: employee, sector: sector, unit: unit, files: files,
      messageFirst: messageFirst, messageAll: messageAll, attendant: attendant,
      sender: sender, employeeNames
    });
  } else {

    res.render('call/show', {
      user: req.session.user, call: call, employee: employee, sector: sector, unit: unit, files: files,
      messageFirst: messageFirst, messageAll: messageAll, attendant: attendant,
      sender: sender
    });

  }



});


module.exports = router;