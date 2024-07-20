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


let transporter = nodemailer.createTransport({
  host: 'mail.provida.med.br', // Substitua pelo endereço do seu servidor SMTP
  port: 587, // Substitua pela porta do seu servidor SMTP
  secure: false, // Use TLS ou SSL
  auth: {
      user: 'nao-responda@provida.med.br', // Substitua pelo seu email corporativo
      pass: 'HJ^c+4_gAwiF' // Substitua pela senha do seu email corporativo
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
      user: 'naoresponda@grupoprovida.com.br', // Substitua pelo seu email corporativo
      pass: 'Daruma@2024' // Substitua pela senha do seu email corporativo
  },
  debug: true,
  logger:true
}); */

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


router.get('/purchases', adminAuth, (req, res) => {

  let message = "Requisição de compras/serviços criada com sucesso";

  if(req.query.success){
  
    res.render('purchaseAndServices/index.ejs', { user: req.session.user, message: message });

  }else{

    res.render('purchaseAndServices/index.ejs', { user: req.session.user, message: '' });

  }
  
});



router.post('/upload/purchases/revision_orcament', adminAuth, upload.array('files'), async (req, res) => {


  const files = req.files;
  var item = req.body.newitem1;
  var value = req.body.newvalue1;

  var count = 1;
  var total = 0.00;

  const purchase = await Purchase.findByPk(req.body.purchase_id);
  const manager = await Employee.findByPk(purchase.employee_id);
  const leader = await Employee.findByPk(purchase.leader_id);
  const purchases = await Employee.findByPk(req.session.user.employee.id);

  while (item != undefined && value != undefined) {

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

  const director = await Profile.findAll({
    where: {
      description: 'directors'
    }
  });
 
  const directorsLoginsPromises = director.map(async (dir) => {
    let user = await User.findOne({
      where: {
        profile_id: dir.id
      }
    });
    return user.login; // Return the user's login
  });

  const directorLogins = await Promise.all(directorsLoginsPromises);

  const emails = [manager.email, leader.email, purchases.email, ...directorLogins];

    //movements
    await Movement.create({

      purchase_id: req.session.user.employee.id,
      purchases_id: purchase.id,
      status: 'Em análise pelo diretor'
  
    });
    //movements


  // Send emails to all recipients
  emails.forEach(async (email) => {

    console.log("Email: " + email);

    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${req.body.purchase_id}`;
    let text = "Compras aceitou a solicitação de pagamento.\n"
    + "\n\n Comprador(a): " + purchases.name + 
    "\n E-mail: " + purchases.email +
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



router.get('/revision_orcament/:id', adminAuth, async (req, res) => {
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


router.post('/purchase/accept/financial', upload.array('files'), adminAuth, async (req, res) => {

  const id = req.body.purchase_id;
  const files = req.files;

    //movements
    await Movement.create({

      financial_id: req.session.user.employee.id,
      purchases_id: id,
      status: 'APROVADO'
  
    });
    //movements

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


  const purchase = await Purchase.findByPk(id);
   const manager = await Employee.findByPk(purchase.employee_id);
   const leader = await Employee.findByPk(purchase.leader_id);
   const director = await Employee.findByPk(purchase.director_id);
   const purchases = await Employee.findByPk(purchase.purchase_id);
   const financial = await Employee.findByPk(req.session.user.employee.id);
  
   const emails = [manager.email, leader.email, director.email, purchases.email, financial.email];
 
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


  res.redirect('/dashboard/pending?success=true');

});



router.get('/purchase/accept/leaders/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const purchase = await Purchase.findByPk(id);
  const manager = await Employee.findByPk(purchase.employee_id);
  const leader = await Employee.findByPk(req.session.user.employee.id);

    //movements
    await Movement.create({

      leader_id: req.session.user.employee.id,
      purchases_id: purchase.id,
      status: 'Em análise pelo compras'
  
    });
    //movements

  // Fetch all directors asynchronously
  const purchases = await Profile.findAll({
    where: {
      description: 'purchases'
    }
  });

  // Now you can use map on the directors array
  const purchaseLoginsPromises = purchases.map(async (purchase) => {
    let user = await User.findOne({
      where: {
        profile_id: purchase.id
      }
    });
    return user.login; // Return the user's login
  });

  // Wait for all director logins to be fetched
  const purchaseLogins = await Promise.all(purchaseLoginsPromises);

  // Combine all emails into a single array
  const emails = [manager.email, leader.email, ...purchaseLogins];

  // Send emails to all recipients
  emails.forEach(async (email) => {
    let from = "nao-responda@provida.med.br";
    let to = email;
    let subject = `Solicitação #${id}`;
    let text = "Gestor aceitou a solicitação de pagamento.\n"
    + "\n\n Gestor(a): " + leader.name + 
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

  res.redirect('/dashboard/pending?success=true');

});

//parei aqui
router.get('/purchase/reprove/leaders/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  res.redirect(`/purchases/${id}?modal=leaders`);


});

router.post('/purchase/reprove/leaders', adminAuth, async(req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);

  const purchase = await Purchase.findByPk(id);

  const manager = await Employee.findByPk(purchase.employee_id);

  //const director = await Employee.findByPk(payment.director_id);

  const leader = await Employee.findByPk(req.session.user.employee.id);

  //const purchase = await Employee.findByPk(req.session.user.employee.id);

  //const financial = await Employee.findByPk(payment.financial_id);

if(purchase == undefined){
  console.log("Purchase undefinied")
}else if(manager == undefined){
  console.log("Manager undefinied")
}else if(leader == undefined){
  console.log("Leader undefinied")
}

 //movement
 await Movement.create({

  leader_id: req.session.user.employee.id,
  purchases_id: purchase.id,
  status: 'REPROVADO'

});
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

  let from = "nao-responda@provida.med.br";
  let to = email;
  let subject = `Solicitação #${id}`;
  let text = "Gestor recusou a solicitação de compras/serviços.\n"
  + "Motivo: " + motivo
  + "\n\n Gestor(a): " + leader.name + 
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


router.get('/purchase/accept/directors/:id', adminAuth, async (req, res) => {

  const id = req.params.id;
  const purchase = await Purchase.findByPk(id);
  const manager = await Employee.findByPk(purchase.employee_id);
  const leader = await Employee.findByPk(purchase.leader_id);
  const director = await Employee.findByPk(req.session.user.employee.id);
  const purchases = await Employee.findByPk(purchase.purchase_id);

   //movements
   await Movement.create({

    director_id: req.session.user.employee.id,
    purchases_id: purchase.id,
    status: 'Pagamento em andamento'

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

  
  const emails = [manager.email, leader.email, director.email, purchases.email, ...financialLogins];

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


router.get('/purchase/reprove/directors/:id', adminAuth, (req, res) => {

  const id = req.params.id;

  res.redirect(`/purchases/${id}?modal=directors`)

});

router.post('/purchase/reprove/directors', adminAuth, async (req, res) => {

  const id = req.body.id;

  const motivo = req.body.motivo;

  console.log("Motivo:" + motivo);


  const purchase = await Purchase.findByPk(id);

  const manager = await Employee.findByPk(purchase.employee_id);

  const director = await Employee.findByPk(req.session.user.employee.id);

  const leader = await Employee.findByPk(purchase.leader_id);

  const purchases = await Employee.findByPk(purchase.purchase_id); 

  //const financial = await Employee.findByPk(payment.financial_id);

if(purchase == undefined){
  console.log("Purchase undefinied")
}else if(manager == undefined){
  console.log("Manager undefinied")
}else if(leader == undefined){
  console.log("Leader undefinied")
}else if(director == undefined){
  console.log("Purchase undefinied")
}else if(purchases == undefined){
  console.log("Purchase undefinied")
}

 //movement
 await Movement.create({

  director_id: req.session.user.employee.id,
  purchases_id: purchase.id,
  status: 'REPROVADO'

});
//movement


const emails = [manager.email, leader.email, director.email, purchases.email];

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

  console.log("Email: " + email);

  let from = "nao-responda@provida.med.br";
  let to = email;
  let subject = `Solicitação #${id}`;
  let text = "Diretor recusou a solicitação de compras/serviços.\n"
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
    console.log("Purchase undefinied")
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

  const movements = await Movement.findAll({
    where: {
      purchases_id: purchase.id
    }
  });

  if (movements == undefined) {
    console.log("Movements undefinied")

  }

   const movement_users =  movements.map(async (movement) => {

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
   let gestor = false;
  movements.forEach(movement => {

    move_users.forEach(user => {

      if (movement.leader_id == user.id && movement.status == 'Em análise pelo compras' && gestor == false) { 

        console.log("Gestor:" + user.name);

      }

    });

  });

  if(req.query.modal == 'leaders'){

    res.render('purchaseAndServices/show.ejs', { movements, move_users, leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user, unit, modal: 'leaders' });

  }else if(req.query.modal == 'directors'){
  
    res.render('purchaseAndServices/show.ejs', { movements, move_users, leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user, unit, modal: 'directors' });

  }else{

    res.render('purchaseAndServices/show.ejs', { movements, move_users, leader_employee, director_employee, financial_employee, purchase_employee, purchase, employee, item, sector, files, user: req.session.user, unit, modal: '' });

  }

});




router.post('/upload/purchases', upload.array('files'), adminAuth, async (req, res) => {

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
    let subject = `Solicitação #${newPurchase.id}`;
    let text = "Nova solicitação de compras/serviços gerada.\n"
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




  res.redirect('/purchases/?success=true');

});

module.exports = router;
