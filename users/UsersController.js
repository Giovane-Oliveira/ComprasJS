const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs');
const User = require('../users/User')
const Sector = require('../users/Sector')
const Unit = require('../users/Unit')
const Employee = require('../employees/Employee')
const Profile = require('../users/Profile')
const Permissions = require('../users/Permission')
const Token = require('../users/Token')
const { Op, where } = require('sequelize');
const adminAuth = require('../middlewares/adminAuth');
const nodemailer = require('nodemailer');
const Payment = require('../payments/Payment');
const Purchase = require('../purchaseAndServices/Purchase');
const pug = require('pug');

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

//Encaminhamento para a página de registros
router.get('/registration', (req, res) => {

    res.render('registrations/index.ejs');

});

//Encaminhamento para a página de permissões com as mesmas coletadas do banco de dados
router.get('/permission/:id', adminAuth, async (req, res) => {

    const id = req.params.id;

    const permissions = await Permissions.findOne({
        where: {
            user_id: id
        }
    }).catch((err) => {
        console.log(err);
    });

    res.render('users/permission.ejs', { user: req.session.user, permissions: permissions });

});

//ativar permissões do usuário
router.get('/activate/permission/:name/:id', adminAuth, (req, res) => {

    const id = req.params.id;
    const name = req.params.name;

    if (name == 'user_registration') {

        Permissions.update({
            user_registration: 1
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });

    } else if (name == 'supplier_registration') {

        Permissions.update({
            supplier_registration: 1
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });
    }else if (name == 'create_call') {

        Permissions.update({
            create_call: 1
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });
    }else if (name == 'create_category') {

        Permissions.update({
            create_category: 1
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    res.redirect('/permission/' + id);

});


//desativar permissões
router.get('/desactivate/permission/:name/:id', adminAuth, (req, res) => {

    const id = req.params.id;
    const name = req.params.name;


    if (name == 'user_registration') {

        Permissions.update({
            user_registration: 0
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });

    } else if (name == 'supplier_registration') {

        Permissions.update({
            supplier_registration: 0
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });
    }else if (name == 'create_call') {

        Permissions.update({
            create_call: 0
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });
    }else if (name == 'create_category') {

        Permissions.update({
            create_category: 0
        }, {
            where: {
                user_id: id
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    res.redirect('/permission/' + id);

});


//listar usuários
router.get('/users', adminAuth, async (req, res) => {

    const user = await User.findAll().catch(err => {
        console.log(err);
    });

    res.render('users/index.ejs', { user: req.session.user, listusers: user });

});

//ativar usuário
router.get('/activate_user/:id', adminAuth, (req, res) => {

    const id = req.params.id;

    User.update({
        active: 1
    }, {
        where: {
            id: id
        }
    }).then(() => {
        res.redirect('/users');
    }).catch(err => {
        console.log(err);
    });

});

//desativar usuário
router.get('/desactivate_user/:id', adminAuth, (req, res) => {

    const id = req.params.id;

    User.update({
        active: 0
    }, {
        where: {
            id: id
        }
    }).then(() => {
        res.redirect('/users');
    }).catch(err => {
        console.log(err);
    });

});

//auntenticar usuário
router.post("/authenticate", async (req, res) => {

    var email = req.body?.email;
    var password = req.body?.password;

    try {

        const user = await User.findOne({ where: { login: email } }).catch(err => console.log(err));

        const profile = await Profile.findOne({ where: { id: user.profile_id } }).catch(err => console.log(err));

        const employee = await Employee.findOne({ where: { id: user.employee_id } }).catch(err => console.log(err));

        const permissions = await Permissions.findOne({ where: { user_id: user.id } }).catch(err => console.log(err));

        const sector = await Sector.findOne({ where: { id: employee.sector_id } }).catch(err => console.log(err));

        const unit = await Unit.findOne({ where: { sector_id: employee.sector_id } }).catch(err => console.log(err));;


        console.log(user, profile, employee, permissions, sector, unit);


        if (user != undefined) {

            var correct = bcrypt.compareSync(password, user.password);

            if (user.active == 1) {

                if (correct) {

                    req.session.user = {

                        user: user,
                        profile: profile,
                        employee: employee,
                        permissions: permissions,
                        sector: sector,
                        unit: unit

                    }

                    res.redirect("/dashboard");
                    return;


                } else {
                    req.flash('error', 'Usuário ou senha incorretos!');
                    res.redirect("/");
                    return;
                }

            } else {

                req.flash('error', 'Usuário ou senha incorretos!');
                res.redirect("/");
                return;

            }

        } else {
            req.flash('error', 'Usuário ou senha incorretos!');
            res.redirect("/");
            return;
        }


    } catch (err) {

        console.log(err);
        req.flash('error', 'Usuário ou senha incorretos!');
        res.redirect("/");
        return;
    }

});


router.get("/logout", (req, res) => {
    req.session.user = undefined;
    res.redirect("/");
});

//redirecionar para a página de gerar token
router.get('/registrations_token', adminAuth, (req, res) => {

    res.render('registrationsToken/index.ejs', { message: '', user: req.session.user });

});

//redirecionar para a página de solicitações pendentes com as mesmas correspondentes
router.get('/dashboard/pending', adminAuth, async (req, res) => {

    var success = req.flash('success');
    var message = (success == undefined || success.length == 0) ? '' : success;

    if (req.session.user.profile.description.includes('managers')) {

        const pending_payments = await Payment.findAll({
            where: {
                employee_id: req.session.user.employee.id,
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });


        const pending_purchases = await Purchase.findAll({

            where: {
                employee_id: req.session.user.employee.id,
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });

        res.render("dashboard/pending.ejs", { user: req.session.user, payments: pending_payments, purchases: pending_purchases, message: message });

    } else if (req.session.user.profile.description.includes('leaders') ||
        req.session.user.profile.description.includes('directors') ||
        req.session.user.profile.description.includes('ti') ||
        req.session.user.profile.description.includes('purchases') ||
        req.session.user.profile.description.includes('financial')) {

        const pending_payments = await Payment.findAll({
            where: {
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });

        const pending_purchases = await Purchase.findAll({
            where: {
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });

        const pending = pending_payments.length + pending_purchases.length;

        const reproved_purchases = await Purchase.findAll({
            where: {
                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved_payments = await Payment.findAll({
            where: {
                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved = reproved_payments.length + reproved_purchases.length;


        const aproved_purchases = await Purchase.findAll({
            where: {
                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const aproved_payments = await Payment.findAll({
            where: {
                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        const aproved = aproved_payments.length + aproved_purchases.length;

        res.render("dashboard/pending.ejs", { user: req.session.user, pending: pending, reproved: reproved, aproved: aproved, payments: pending_payments, purchases: pending_purchases, message: message });

    } else {
        res.redirect("/");
        return;
    }

});

//Solicitações reprovadas
router.get('/dashboard/reproved', adminAuth, async (req, res) => {

    if (req.session.user.profile.description.includes('managers')) {

        const reproved_purchases = await Purchase.findAll({
            where: {
                employee_id: req.session.user.employee.id,
                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved_payments = await Payment.findAll({
            where: {
                employee_id: req.session.user.employee.id,
                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        res.render("dashboard/reproved.ejs", { user: req.session.user, payments: reproved_payments, purchases: reproved_purchases });

    } else if (req.session.user.profile.description.includes('leaders') ||
        req.session.user.profile.description.includes('directors') ||
        req.session.user.profile.description.includes('ti') ||
        req.session.user.profile.description.includes('purchases') ||
        req.session.user.profile.description.includes('financial')) {

        const reproved_purchases = await Purchase.findAll({
            where: {

                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved_payments = await Payment.findAll({
            where: {

                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        res.render("dashboard/reproved.ejs", { user: req.session.user, payments: reproved_payments, purchases: reproved_purchases });

    } else {
        res.redirect("/");
        return;
    }

});

// Solicitações aprovadas
router.get('/dashboard/aproved', adminAuth, async (req, res) => {

    if (req.session.user.profile.description.includes('managers')) {

        const reproved_purchases = await Purchase.findAll({
            where: {
                employee_id: req.session.user.employee.id,
                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved_payments = await Payment.findAll({
            where: {
                employee_id: req.session.user.employee.id,
                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        res.render("dashboard/aproved.ejs", { user: req.session.user, payments: reproved_payments, purchases: reproved_purchases });

    } else if (req.session.user.profile.description.includes('leaders') ||
        req.session.user.profile.description.includes('directors') ||
        req.session.user.profile.description.includes('ti') ||
        req.session.user.profile.description.includes('purchases') ||
        req.session.user.profile.description.includes('financial')) {

        const reproved_purchases = await Purchase.findAll({
            where: {

                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved_payments = await Payment.findAll({
            where: {

                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        res.render("dashboard/aproved.ejs", { user: req.session.user, payments: reproved_payments, purchases: reproved_purchases });

    } else {
        res.redirect("/");
        return;
    }

});

//Encaminhamento para o dashboard
router.get('/dashboard', adminAuth, async (req, res) => {

    var message = req.flash('error');
    message = (message == undefined || message.length == 0) ? '' : message;

    if (req.session.user.profile.description.includes('managers') ||
        req.session.user.profile.description.includes('marketing') ||
        req.session.user.profile.description.includes('rh') ||
        req.session.user.profile.description.includes('sac') ||
        req.session.user.profile.description.includes('sau')) {

        const pending_payments = await Payment.findAll({
            where: {
                employee_id: req.session.user.employee.id,
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });


        const pending_purchases = await Purchase.findAll({

            where: {
                employee_id: req.session.user.employee.id,
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });


        const pending = pending_payments.length + pending_purchases.length;

        const reproved_purchases = await Purchase.findAll({

            where: {
                status: "REPROVADO",
                employee_id: req.session.user.employee.id
            }
        }).catch((err) => {
            console.log(err);
        });


        const reproved_payments = await Payment.findAll({

            where: {
                status: "REPROVADO",
                employee_id: req.session.user.employee.id
            }
        }).catch((err) => {
            console.log(err);
        });

        const reproved = reproved_payments.length + reproved_purchases.length;

        const aproved_purchases = await Purchase.findAll({

            where: {
                status: "APROVADO",
                employee_id: req.session.user.employee.id
            }
        }).catch((err) => {
            console.log(err);
        });

        const aproved_payments = await Payment.findAll({

            where: {
                status: "APROVADO",
                employee_id: req.session.user.employee.id
            }
        }).catch((err) => {
            console.log(err);
        });

        const aproved = aproved_payments.length + aproved_purchases.length;

        const payments = await Payment.findAll({
            order: [['id', 'DESC']],
            limit: 3,
            where: {
                employee_id: req.session.user.employee.id,
            }
        }).catch((err) => {
            console.log(err);
        });

        const purchases = await Purchase.findAll({
            order: [['id', 'DESC']],
            limit: 3,
            where: {
                employee_id: req.session.user.employee.id,
            }

        }).catch((err) => {
            console.log(err);
        });

        res.render("dashboard/index.ejs", { user: req.session.user, pending: pending, reproved: reproved, aproved: aproved, payments: payments, purchases: purchases, message });

    } else if (req.session.user.profile.description.includes('leaders') ||
        req.session.user.profile.description.includes('directors') ||
        req.session.user.profile.description.includes('ti') ||
        req.session.user.profile.description.includes('purchases') ||
        req.session.user.profile.description.includes('financial')) {

        const pending_payments = await Payment.findAll({
            where: {
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });

        const pending_purchases = await Purchase.findAll({
            where: {
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });

        const pending = pending_payments.length + pending_purchases.length;

        const reproved_purchases = await Purchase.findAll({
            where: {
                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        const reproved_payments = await Payment.findAll({
            where: {
                status: "REPROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        const reproved = reproved_payments.length + reproved_purchases.length;

        const aproved_purchases = await Purchase.findAll({
            where: {
                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        const aproved_payments = await Payment.findAll({
            where: {
                status: "APROVADO"
            }
        }).catch((err) => {
            console.log(err);
        });

        const aproved = aproved_payments.length + aproved_purchases.length;

        const payments = await Payment.findAll({
            order: [['id', 'DESC']],
            limit: 3
        }).catch((err) => {
            console.log(err);
        });

        const purchases = await Purchase.findAll({
            order: [['id', 'DESC']],
            limit: 3
        }).catch((err) => {
            console.log(err);
        });

        res.render("dashboard/index.ejs", { user: req.session.user, pending: pending, reproved: reproved, aproved: aproved, payments: payments, purchases: purchases, message: message });

    } else {
        res.redirect("/");
        return;
    }

});

//gerar token
function generateToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
}

// SSE endpoint for dashboard table data
router.get('/dashboard/table', adminAuth, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  
    // Function to update table data
    const updateTableData = async () => {
      try {
        // Get payments and purchases based on user's role
        let payments, purchases;
        if (req.session.user.profile.description.includes('managers') ||
            req.session.user.profile.description.includes('marketing') ||
            req.session.user.profile.description.includes('rh') ||
            req.session.user.profile.description.includes('sac') ||
            req.session.user.profile.description.includes('sau')) {
          payments = await Payment.findAll({
            order: [['id', 'DESC']],
            limit: 10, // Adjust limit as needed
            where: {
              employee_id: req.session.user.employee.id,
            }
          });
          purchases = await Purchase.findAll({
            order: [['id', 'DESC']],
            limit: 10, // Adjust limit as needed
            where: {
              employee_id: req.session.user.employee.id,
            }
          });
        } else if (req.session.user.profile.description.includes('leaders') ||
            req.session.user.profile.description.includes('directors') ||
            req.session.user.profile.description.includes('ti') ||
            req.session.user.profile.description.includes('purchases') ||
            req.session.user.profile.description.includes('financial')) {
          payments = await Payment.findAll({
            order: [['id', 'DESC']],
            limit: 10, // Adjust limit as needed
          });
          purchases = await Purchase.findAll({
            order: [['id', 'DESC']],
            limit: 10, // Adjust limit as needed
          });
        }
  
        // Send table data as SSE event
        res.write(`data: ${JSON.stringify({ payments, purchases })}\n\n`);
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





router.get('/dashboard/badges', adminAuth, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  
    // Function to update badges
    const updateBadges = async () => {
      try {
        // Get pending, reproved, and approved counts
        const pending = await getPendingCount(req.session.user);
        const reproved = await getReprovedCount(req.session.user);
        const approved = await getApprovedCount(req.session.user);
  
        // Send badge data as SSE event
        res.write(`data: ${JSON.stringify({ pending, reproved, approved })}\n\n`);
      } catch (error) {
        console.error('Error updating badges:', error);
      }
    };
  
    // Get initial badge counts
    await updateBadges();
  
    // Set up interval to update badges every 5 seconds
    const interval = setInterval(updateBadges, 60000);
  
    // Close connection on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      console.log('SSE connection closed');
    });
  });
  
  // Helper functions to get badge counts
  const getPendingCount = async (user) => {
    // Logic to get pending count based on user's role
    // Example:
    if (user.profile.description.includes('managers') ||
  user.profile.description.includes('marketing') ||
  user.profile.description.includes('rh') ||
  user.profile.description.includes('sac') ||
  user.profile.description.includes('sau')) {
      const pendingPayments = await Payment.count({
        where: {
          employee_id: user.employee.id,
          [Op.or]: [
            { status: "Em análise pelo gestor" },
            { status: "Em análise pelo diretor" },
            { status: "Em análise pelo compras" },
            { status: "Pagamento em andamento" }
          ]
        }
      });
      const pendingPurchases = await Purchase.count({
        where: {
          employee_id: user.employee.id,
          [Op.or]: [
            { status: "Em análise pelo gestor" },
            { status: "Em análise pelo diretor" },
            { status: "Em análise pelo compras" },
            { status: "Pagamento em andamento" }
          ]
        }
      });
      return pendingPayments + pendingPurchases;
    } else if (user.profile.description.includes('leaders') ||
      user.profile.description.includes('directors') ||
      user.profile.description.includes('ti') ||
      user.profile.description.includes('purchases') ||
      user.profile.description.includes('financial')) {
          const pendingPayments = await Payment.count({
              where: {
                [Op.or]: [
                  { status: "Em análise pelo gestor" },
                  { status: "Em análise pelo diretor" },
                  { status: "Em análise pelo compras" },
                  { status: "Pagamento em andamento" }
                ]
              }
            });
            const pendingPurchases = await Purchase.count({
              where: {
                [Op.or]: [
                  { status: "Em análise pelo gestor" },
                  { status: "Em análise pelo diretor" },
                  { status: "Em análise pelo compras" },
                  { status: "Pagamento em andamento" }
                ]
              }
            });
      return pendingPayments + pendingPurchases;
    }
    return 0;
  };
  
  const getReprovedCount = async (user) => {
    // Logic to get reproved count based on user's role
    // Example:
    if (user.profile.description.includes('managers') ||
   user.profile.description.includes('marketing') ||
    user.profile.description.includes('rh') ||
    user.profile.description.includes('sac') ||
   user.profile.description.includes('sau')) {
      const reprovedPayments = await Payment.count({
        where: {
          employee_id: user.employee.id,
          status: "REPROVADO"
        }
      });
      const reprovedPurchases = await Purchase.count({
        where: {
          employee_id: user.employee.id,
          status: "REPROVADO"
        }
      });
      return reprovedPayments + reprovedPurchases;
    } else if (user.profile.description.includes('leaders') ||
      user.profile.description.includes('directors') ||
      user.profile.description.includes('ti') ||
      user.profile.description.includes('purchases') ||
      user.profile.description.includes('financial')) {
          const reprovedPayments = await Payment.count({
              where: {
                status: "REPROVADO"
              }
            });
            const reprovedPurchases = await Purchase.count({
              where: {
                status: "REPROVADO"
              }
            });
            return reprovedPayments + reprovedPurchases;
    }
    return 0;
  };
  
  const getApprovedCount = async (user) => {
    // Logic to get approved count based on user's role
    // Example:
    if (user.profile.description.includes('managers') ||
   user.profile.description.includes('marketing') ||
   user.profile.description.includes('rh') ||
  user.profile.description.includes('sac') ||
   user.profile.description.includes('sau'))  {
      const approvedPayments = await Payment.count({
        where: {
          employee_id: user.employee.id,
          status: "APROVADO"
        }
      });
      const approvedPurchases = await Purchase.count({
        where: {
          employee_id: user.employee.id,
          status: "APROVADO"
        }
      });
      return approvedPayments + approvedPurchases;
    } else if (user.profile.description.includes('leaders') ||
      user.profile.description.includes('directors') ||
      user.profile.description.includes('ti') ||
      user.profile.description.includes('purchases') ||
      user.profile.description.includes('financial')) {
          const approvedPayments = await Payment.count({
              where: {
                status: "APROVADO"
              }
            });
            const approvedPurchases = await Purchase.count({
              where: {
                status: "APROVADO"
              }
            });
            return approvedPayments + approvedPurchases;
    }
    return 0;
  };

//gerar token e encaminhar e-mail para o usuário solicitante
router.post('/generate_token', adminAuth, async (req, res) => {
    const tokenLength = req.body.length || 5; // Get length from query parameter
    const token = generateToken(tokenLength);
    console.log(`Generated token: ${token}`);

    switch (token.length) {

        case 5:
            Token.create({
                managers: token,
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: "",
                marketing: "",
                sau: "",
                sac: "",
                rh: ""
            }); //gerente
            break;
        case 6:
            Token.create({
                managers: "",
                leaders: token,
                directors: "",
                purchases: "",
                financial: "",
                ti: "",
                marketing: "",
                sau: "",
                sac: "",
                rh: ""
            }); //gestores
            break;
        case 7:
            Token.create({
                managers: "",
                leaders: "",
                directors: token,
                purchases: "",
                financial: "",
                ti: "",
                marketing: "",
                sau: "",
                sac: "",
                rh: ""
            }); //diretores 
            break;
        case 8:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: token,
                financial: "",
                ti: "",
                marketing: "",
                sau: "",
                sac: "",
                rh: ""
            }); //compras
            break;
        case 9:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: token,
                ti: "",
                marketing: "",
                sau: "",
                sac: "",
                rh: ""
            }); //financeiro
            break;
        case 10:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: token,
                marketing: "",
                sau: "",
                sac: "",
                rh: ""
            }); //tecnologia da informação
            break;
        case 11:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: "",
                marketing: token,
                sau: "",
                sac: "",
                rh: ""
            });
            break;
        case 12:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: "",
                marketing: "",
                sau: token,
                sac: "",
                rh: ""
            });
            break;
        case 13:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: "",
                marketing: "",
                sau: "",
                sac: token,
                rh: ""
            });
            break;
        case 14:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: "",
                marketing: "",
                sau: "",
                sac: "",
                rh: token
            });
            break;
        default:
            res.render('registrationsToken/index.ejs', { message: 'Erro ao gerar o token', user: req.session.user });
            Token.destroy({
                where: {
                    [Op.or]: [
                        { managers: token },
                        { leaders: token },
                        { directors: token },
                        { purchases: token },
                        { financial: token },
                        { ti: token },
                        { marketing: token },
                        { sau: token },
                        { sac: token },
                        { rh: token }
                    ]
                }
            }).catch((err) => {
                console.log(err);
            });
            break;
    }

    let from = "suporte.ti@grupoprovida.com.br";
    let to = req.body.email;
    let subject = "Cadastro";
    let text = "Clique no botão para completar seu cadastro:";
    let link = "http://52.156.72.125:3001/registrations/" + token + "\n";

    let mailOptions = {
        from,
        to,
        subject,
        html: pug.renderFile('views/pugs/register_user.pug', { text: text, link: link })
    };

    try {
        await transporter.sendMail(mailOptions);
        res.render('registrationsToken/index.ejs', { message: "Email enviado com sucesso!", user: req.session.user });
    } catch (error) {
        Token.destroy({
            where: {
                [Op.or]: [
                    { managers: token },
                    { leaders: token },
                    { directors: token },
                    { purchases: token },
                    { financial: token },
                    { ti: token },
                    { marketing: token },
                    { sau: token },
                    { sac: token },
                    { rh: token }
                ]
            }
        }).catch((err) => {
            console.log(err);
        });
        res.render('registrationsToken/index.ejs', { message: "Erro ao enviar o email \n " + error, user: req.session.user });
    }
});

//verifica token e libera acesso para a página de cadastro
router.get('/registrations/:token', (req, res) => {

    const token = req.params.token;
    var profile = null;
    console.log(token);

    switch (token.length) {

        case 5:
            profile = 'managers';  //gerente
            break;
        case 6:
            profile = 'leaders'; //gestores
            break;
        case 7:
            profile = 'directors'; // diretores 
            break;
        case 8:
            profile = 'purchases'; // compras
            break;
        case 9:
            profile = 'financial'; //financeiro
            break;
        case 10:
            profile = 'ti'; //T.I
            break;
        case 11:
            profile = 'marketing';
            break;
        case 12:
            profile = 'sau';
            break;
        case 13:
            profile = 'sac';
            break;
        case 14:
            profile = 'rh';
            break;
        default:
            profile = 'managers';
            break;
    }

    Token.findOne({
        where: {
            [Op.or]: [
                { managers: token },
                { leaders: token },
                { directors: token },
                { purchases: token },
                { financial: token },
                { ti: token },
                { marketing: token },
                { sau: token },
                { sac: token },
                { rh: token }
            ]
        }
    }).then(tipo => {
        if (tipo == undefined) {

            console.log(profile);
            req.flash('error', 'Link inválido!');
            res.redirect('/');

        } else {

            console.log(`Profile: ${profile} Token: ${token}`);
            res.render('registrations/index', { profile: profile, token: token });

        }
    }).catch(err => {
        console.log(err);
    });

});

//Encaminha para a página de recuperação de senha
router.get('/recover/sendmail', async (req, res) => {

    res.render('registrations/sendmail');

});

//Altera a senha, excluí o token e encaminha para a tela de login
router.post('/recover/password', async (req, res) => {

    var email = req.body?.email;
    var token = req.body?.token;
    var password = req.body?.password;

    console.log(`Email: ${email} Token: ${token} Password: ${password}`);

    User.findOne({ where: { login: email } }).then(async user => {
        if (user != undefined) {

            User.update({
                password: bcrypt.hashSync(password, 10)
            }, {
                where: {
                    login: email
                }
            }).then(() => {

                Token.destroy({
                    where: {
                        managers: token
                    }
                }).then(() => {
                    req.flash('success', 'Senha alterada com sucesso!');
                    res.redirect('/');
                    return;
                }).catch(() => {
                    req.flash('error', 'Erro ao alterar a senha!');
                    res.redirect('/');
                    return;
                });

            }).catch(() => {
                req.flash('error', 'Este email já está registrado ou link inválido!');
                res.redirect('/');
                return;
            });
        } else {
            req.flash('error', 'Este email já está registrado ou link inválido!');
            return;
        }
    }).catch(err => {
        console.log(err);
    });

});

//Verifica o token e encaminha para a página de alterar a senha
router.get('/recover/alter_password/:email/:token', async (req, res) => {

    const token = req.params.token;
    const email = req.params.email;
    console.log(token, email);

    Token.findOne({
        where: {
            managers: token
        }
    }).then((Token) => {

        if (Token == undefined) {
            req.flash('error', 'Link inválido!');
            res.redirect('/');
            return;
        } else {
            res.render('registrations/recover', { email: email, token: token });
            return;
        }

    }).catch(() => {
        req.flash('error', 'Link inválido!');
        res.redirect('/');
        return;
    });
});



//Gerar token para alterar a senha e encaminhar por e-mail
router.post('/recover/alter_password', async (req, res) => {
    var email = req.body?.email;
    const token = generateToken(5);
    console.log(email);
    User.findOne({ where: { login: req.body.email } }).then(async user => {

        if (user != undefined) {
            Token.create({
                managers: token,
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
            });

            let from = "suporte.ti@grupoprovida.com.br";
            let to = email;
            let subject = "Recuperação da Conta";
            let text = "Clique no botão abaixo para alterar sua senha:";
            let link = "http://52.156.72.125:3001/recover/alter_password/" + email + "/" + token;

            let mailOptions = {
                from,
                to,
                subject,
                html: pug.renderFile('views/pugs/recover_password.pug', { text: text, link: link })
            };

            try {
                await transporter.sendMail(mailOptions);
                req.flash('success', 'Email de recuperação de senha enviado!');
                res.redirect('/');
                return;
            } catch (error) {
                req.flash('error', 'Erro ao enviar o email \n ' + error);
                res.redirect('/');
                return;
            }

        } else {
            req.flash('error', 'Este email não está registrado!');
            res.redirect('/');
            return;
        }
    }).catch(err => {
        console.log(err);
    });
});

//Criar cadastro do usuário e redirecionar para a tela de login
router.post('/registration/create', async (req, res) => {

    const name = req.body?.name;
    const email = req.body?.email;
    const password = req.body?.password;
    const cpf = req.body?.cpf;
    var sector = req.body?.sector;
    const cep = req.body?.cep;
    const address = req.body?.address;
    const phone = req.body?.phone;
    const city = req.body?.city;
    var description = req.body?.description;
   
    const profile = req.body?.profile;
    const token = req.body?.token;

    var user_registration; // cadastro de usuário
    var supplier_registration; // cadastro de fornecedor
    var create_call; // abrir chamado
    var create_category; // create category

    if (sector == undefined) {

        sector = 'Administrativo'
    }

    if (description == undefined) {

        description = city;
    }

    switch (profile) {

        case 'managers': //gerentes
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'leaders': //gestores
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'directors': //diretores
            user_registration = 1; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'purchases': //compras
            user_registration = 0; // cadastro de usuário
            supplier_registration = 1; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'financial': //financeiro
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'ti': //T.I
            user_registration = 1; // cadastro de usuário
            supplier_registration = 1; // cadastro de fornecedor
            create_call = 1;
            create_category = 1;
            break;
        case 'marketing': //gerentes
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'sau': //gerentes
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'sac': //gerentes
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
        case 'rh': //gerentes
            user_registration = 0; // cadastro de usuário
            supplier_registration = 0; // cadastro de fornecedor
            create_call = 0;
            create_category = 0;
            break;
    }

    User.findOne({ where: { login: email } }).then(async user => {

        if (user == undefined) {
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);

            try {
                // Create Sector
                var newSector = await Sector.findOne({
                    where: {
                        description: sector
                    }
                }).catch((err) => {
                    console.log(err);
                });

                if (newSector == undefined) {

                    newSector = await Sector.create({
                        description: sector
                    }).catch((err) => {
                        console.log(err);
                    });
                }
                // Create Unit
                var newUnit = await Unit.findOne({
                    where: {
                        description: description,
                        address: address,
                        city: city,
                        cep: cep,
                        phone: phone
                    }
                }).catch((err) => {
                    console.log(err);
                });


                if (newUnit == undefined) {

                    newUnit = await Unit.create({
                        description: description,
                        address: address,
                        city: city,
                        cep: cep,
                        phone: phone,
                        sector_id: newSector.id // Use the newly created sector's ID
                    }).catch((err) => {
                        console.log(err);
                    });
                }
                // Create Employee
                const newEmployee = await Employee.create({
                    name: name,
                    cpf: cpf,
                    email: email,
                    unit_id: newUnit.id, // Use the newly created unit's ID
                    sector_id: newSector.id
                }).catch((err) => {
                    console.log(err);
                });

                var newProfile = await Profile.findOne({
                    where: {
                        description: profile
                    }
                }).catch((err) => {
                    console.log(err);
                });

                if (newProfile == undefined) {

                    // Create Profile
                    newProfile = await Profile.create({
                        description: profile
                    }).catch((err) => {
                        console.log(err);
                    });

                }

                // Create User
                const newUser = await User.create({
                    login: email,
                    password: hash,
                    active: 1,
                    profile_id: newProfile.id, // Use the newly created profile's ID
                    employee_id: newEmployee.id // Use the newly created employee's ID
                }).catch((err) => {
                    console.log(err);
                });

                // Create Permissions
                await Permissions.create({         
                    user_registration: user_registration,
                    supplier_registration: supplier_registration,
                    employee_id: newEmployee.id,
                    profile_id: newProfile.id,
                    create_call: create_call,
                    create_category: create_category,
                    user_id: newUser.id // Use the newly created user's ID
                }).catch((err) => {
                    console.log(err);
                });

                // Create Token
                Token.destroy({
                    where: {
                        [Op.or]: [
                            { managers: token },
                            { leaders: token },
                            { directors: token },
                            { purchases: token },
                            { financial: token },
                            { ti: token },
                            { marketing: token },
                            { sau: token },
                            { sac: token },
                            { rh: token }
                        ]
                    }
                }
                ).then(() => {
                    console.log('Tokens deleted successfully.');
                    req.flash('success', 'Cadastro realizado com sucesso!');
                    res.redirect('/');
                    return;
                }).catch((err) => {
                    console.log(err);
                });

            } catch (error) {
                console.error('Error creating user:', error);
            }

        } else {
            req.flash('error', 'Este email já está registrado!');
            res.redirect('/');
            return;

        }
    }).catch((err) => {
        console.log(err);
    });
});

module.exports = router;