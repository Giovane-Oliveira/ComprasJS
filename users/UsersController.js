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
const Purchase = require('../purchaseAndServices/Purchase')

let transporter = nodemailer.createTransport({
    host: 'mail.provida.med.br', // Substitua pelo endereço do seu servidor SMTP
    port: 587, // Substitua pela porta do seu servidor SMTP
    secure: false, // Use TLS ou SSL
    auth: {
        user: 'nao-responda@provida.med.br', // Substitua pelo seu email corporativo
        pass: 'HJ^c+4_gAwiF' // Substitua pela senha do seu email corporativo
    }
});

router.get('/registration', (req, res) => {

    res.render('registrations/index.ejs');

});

router.get('/users', adminAuth, (req, res) => {

    res.render('users/index.ejs', { user: req.session.user });

});


router.post("/authenticate", async (req, res) => {

    var email = req.body?.email;
    var password = req.body?.password;
    console.log(email, password);


    try {

        const user = await User.findOne({ where: { login: email } });

        const profile = await Profile.findOne({ where: { id: user.profile_id } });

        const employee = await Employee.findOne({ where: { id: user.employee_id } });

        const permissions = await Permissions.findOne({ where: { user_id: user.id } });

        const sector = await Sector.findOne({ where: { id: employee.sector_id } });

        const unit = await Unit.findOne({ where: { sector_id: employee.sector_id } });


        console.log(user, profile, employee, permissions, sector, unit);


        if (profile == undefined) {

            console.log("Profile undefined");

        } else if (employee == undefined) {

            console.log("Employee undefined");

        } else if (permissions == undefined) {

            console.log("Permissions undefined");

        } else if (sector == undefined) {

            console.log("Sector undefined");

        } else if (unit == undefined) {

            console.log("Unit undefined");

        }


        if (user != undefined) {
            //Validar senha
            var correct = bcrypt.compareSync(password, user.password);

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
                res.redirect("/?login=true");
                return;
            }

        } else {
            res.redirect("/?login=true");
            return;
        }


    } catch (err) {

        console.log(err);
        res.redirect("/?login=true");
        return;
    }

});




router.get("/logout", (req, res) => {
    req.session.user = undefined;
    res.redirect("/");
});


router.get('/registrations_token', adminAuth, (req, res) => {

    res.render('registrationsToken/index.ejs', { token: '', user: req.session.user });

});

router.get('/dashboard', adminAuth, async (req, res) => {

    if (req.session.user.profile.description.includes('managers') ||
    req.session.user.profile.description.includes('purchases') ||
    req.session.user.profile.description.includes('financial')) {

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
        });

        const pending = pending_payments.length + pending_purchases.length;

        const reproved_purchases = await Purchase.findAll({
            
            where: {
                status: "REPROVADO",
                employee_id: req.session.user.employee.id
            }
        });

        const reproved_payments = await Payment.findAll({
            
            where: {
                status: "REPROVADO",
                employee_id: req.session.user.employee.id
            }
        });

        const reproved = reproved_payments.length + reproved_purchases.length;


        const aproved_purchases = await Purchase.findAll({
          
            where: {
                status: "APROVADO",
                employee_id: req.session.user.employee.id
            }
        });

        const aproved_payments = await Payment.findAll({
            
            where: {
                status: "APROVADO",
                employee_id: req.session.user.employee.id
            }
        });

        const aproved = aproved_payments.length + aproved_purchases.length;

        const payments = await Payment.findAll({
            order: [['id', 'DESC']],
            limit: 3,
            where: {
            employee_id: req.session.user.employee.id,
          
          
            }
        });

        const purchases = await Purchase.findAll({
            order: [['id', 'DESC']],
            limit: 3,
            where: {
            employee_id: req.session.user.employee.id,
            }
            
        });


        res.render("dashboard/index.ejs", { user: req.session.user, pending: pending, reproved: reproved, aproved: aproved, payments: payments, purchases: purchases });

    } else if (req.session.user.profile.description.includes('leaders') ||
    req.session.user.profile.description.includes('directors') ||
    req.session.user.profile.description.includes('ti')) {

        const pending_payments = await Payment.findAll({
            where: {
                [Op.or]: [
                    { status: "Em análise pelo gestor" },
                    { status: "Em análise pelo diretor" },
                    { status: "Em análise pelo compras" },
                    { status: "Pagamento em andamento" }
                ]
            }
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
        });

        const pending = pending_payments.length + pending_purchases.length;

        const reproved_purchases = await Purchase.findAll({
            where: {
                status: "REPROVADO"
            }
        });

        const reproved_payments = await Payment.findAll({
            where: {
                status: "REPROVADO"
            }
        });

        const reproved = reproved_payments.length + reproved_purchases.length;


        const aproved_purchases = await Purchase.findAll({
            where: {
                status: "APROVADO"
            }
        });

        const aproved_payments = await Payment.findAll({
            where: {
                status: "APROVADO"
            }
        });

        const aproved = aproved_payments.length + aproved_purchases.length;

        const payments = await Payment.findAll({
            order: [['id', 'DESC']],
            limit: 3
        
        
        });

        const purchases = await Purchase.findAll({
            order: [['id', 'DESC']],
            limit: 3
         
            
        });

  

        res.render("dashboard/index.ejs", { user: req.session.user, pending: pending, reproved: reproved, aproved: aproved,  payments: payments, purchases: purchases});

    } else {
        res.redirect("/");
        return;
    }

});

function generateToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
}

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
                ti: ""
            }); //gerente
            break;
        case 6:
            Token.create({
                managers: "",
                leaders: token,
                directors: "",
                purchases: "",
                financial: "",
                ti: ""
            }); //gestores
            break;
        case 7:
            Token.create({
                managers: "",
                leaders: "",
                directors: token,
                purchases: "",
                financial: "",
                ti: ""
            }); //diretores 
            break;
        case 8:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: token,
                financial: "",
                ti: ""
            }); //compras
            break;
        case 9:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: token,
                ti: ""
            }); //financeiro
            break;
        case 10:
            Token.create({
                managers: "",
                leaders: "",
                directors: "",
                purchases: "",
                financial: "",
                ti: token
            }); //tecnologia da informação
            break;
        default:
            res.render('registrationsToken/index.ejs', { token: 'Erro ao gerar o token', user: req.session.user });
            Token.destroy({
                where: {
                    [Op.or]: [
                        { managers: token },
                        { leaders: token },
                        { directors: token },
                        { purchases: token },
                        { financial: token },
                        { ti: token }
                    ]
                }
            });
            break;
    }

    let from = "nao-responda@provida.med.br";
    let to = req.body.email;
    let subject = "Cadastro";
    let text = "Complete seu cadastro: \n" + "http://10.0.16.17:3000/registrations/" + token + "\n";

    let mailOptions = {
        from,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        res.render('registrationsToken/index.ejs', { token: "Email enviado com sucesso!", user: req.session.user });
    } catch (error) {
        Token.destroy({
            where: {
                [Op.or]: [
                    { managers: token },
                    { leaders: token },
                    { directors: token },
                    { purchases: token },
                    { financial: token },
                    { ti: token }
                ]
            }
        });
        res.render('registrationsToken/index.ejs', { token: "Erro ao enviar o email \n " + error, user: req.session.user });
    }
});



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
                { ti: token }
            ]
        }
    }).then(tipo => {
        if (tipo == undefined) {

            console.log(profile);
            res.redirect('/?error=true');

        } else {

            console.log(`Profile: ${profile} Token: ${token}`);
            res.render('registrations/index', { profile: profile, token: token });

        }
    });

});

router.get('/recover/sendmail', async (req, res) => {

    res.render('registrations/sendmail');

});

router.post('/recover/password', async (req, res) => {

    var email = req.body?.email;
    var token = req.body?.token;
    var password = req.body?.password;

    console.log(email, token);

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
                    res.redirect('/?recover=true');
                    return;
                }).catch(() => {
                    res.redirect('/?recover_error=true');
                    return;
                });

            }).catch(() => {
                res.redirect('/?error=true');
                return;
            });
        } else {
            res.redirect('/?error=true');
            return;
        }
    });

});




router.get('/recover/alter_password/:email/:token', async (req, res) => {

    const token = req.params.token;
    const email = req.params.email;
    console.log(token, email);

    Token.findOne({
        where: {
            managers: token
        }
    }).then((token) => {

        if (token == undefined) {
            res.redirect('/?error=true');
            return;
        } else {
            res.render('registrations/recover', { email: email, token: token });
            return;
        }

    }).catch(() => {
        res.redirect('/?error=true');
        return;
    });


});


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

            let from = "nao-responda@provida.med.br";
            let to = email;
            let subject = "Recuperação da Conta";
            let text = "Altere sua senha: \n" + "http://10.0.16.17:3000/recover/alter_password/" + email + "/" + token + "\n";

            let mailOptions = {
                from,
                to,
                subject,
                text
            };

            try {
                await transporter.sendMail(mailOptions);
                res.redirect('/?sendmail=true');
                return;
            } catch (error) {
                res.redirect('/?error_send_mail=true');
                return;
            }

        } else {
            res.redirect('/?error_send_mail=true');
            return;
        }
    });
});

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
    const status = 1;
    const profile = req.body?.profile;
    const token = req.body?.token;


    var open_request; // abrir requisição
    var attach_nf; // anexar nota fiscal
    var attach_doc; // anexar documento
    var attach_charge; // anexar cobrança
    var receipt_attachment; // anexar comprovante
    var commercial_authorization; // autorização comercial
    var financial_authorization; // autorização financeira
    var validation; // validação
    var closure; // encerramento

    if (sector == undefined) {

        sector = 'Administrativo'
    }

    if (description == undefined) {

        description = city;
    }

    switch (profile) {

        case 'managers': //gerentes
            open_request = 1; // abrir requisição
            attach_nf = 0; // anexar nota fiscal
            attach_doc = 1; // anexar documento
            attach_charge = 1; // anexar cobrança
            receipt_attachment = 0; // anexar comprovante
            commercial_authorization = 0; // autorização comercial
            financial_authorization = 0; // autorização financeira
            validation = 0; // validação
            closure = 0; // encerramento
            user_registration = 0; // cadastro de usuário
            break;
        case 'leaders': //gestores
            open_request = 0; // abrir requisição
            attach_nf = 0; // anexar nota fiscal
            attach_doc = 0; // anexar documento
            attach_charge = 0; // anexar cobrança
            receipt_attachment = 0; // anexar comprovante
            commercial_authorization = 1; // autorização comercial
            financial_authorization = 0; // autorização financeira
            validation = 0; // validação
            closure = 1; // encerramento
            user_registration = 1; // cadastro de usuário
            break;
        case 'directors': //diretores
            open_request = 0; // abrir requisição
            attach_nf = 0; // anexar nota fiscal
            attach_doc = 0; // anexar documento
            attach_charge = 0; // anexar cobrança
            receipt_attachment = 0; // anexar comprovante
            commercial_authorization = 0; // autorização comercial
            financial_authorization = 1; // autorização financeira
            validation = 0; // validação
            closure = 1; // encerramento
            user_registration = 1; // cadastro de usuário
            break;
        case 'purchases': //compras
            open_request = 0; // abrir requisição
            attach_nf = 0; // anexar nota fiscal
            attach_doc = 1; // anexar documento
            attach_charge = 0; // anexar cobrança
            receipt_attachment = 0; // anexar comprovante
            commercial_authorization = 0; // autorização comercial
            financial_authorization = 0; // autorização financeira
            validation = 1; // validação
            closure = 1; // encerramento
            user_registration = 0; // cadastro de usuário
            break;
        case 'financial': //financeiro
            open_request = 0; // abrir requisição
            attach_nf = 1; // anexar nota fiscal
            attach_doc = 0; // anexar documento
            attach_charge = 0; // anexar cobrança
            receipt_attachment = 1; // anexar comprovante
            commercial_authorization = 0; // autorização comercial
            financial_authorization = 0; // autorização financeira
            validation = 0; // validação
            closure = 1; // encerramento
            user_registration = 0; // cadastro de usuário
            break;
        case 'ti': //T.I
            open_request = 1; // abrir requisição
            attach_nf = 1; // anexar nota fiscal
            attach_doc = 1; // anexar documento
            attach_charge = 1; // anexar cobrança
            receipt_attachment = 1; // anexar comprovante
            commercial_authorization = 1; // autorização comercial
            financial_authorization = 1; // autorização financeira
            validation = 1; // validação
            closure = 1; // encerramento
            user_registration = 1; // cadastro de usuário
            break;
    }

    console.log(name, email, password, cpf, sector, cep, address, phone, city, description, status, profile);

    User.findOne({ where: { login: email } }).then(async user => {

        if (user == undefined) {
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);

            try {
                // Create Sector
                const newSector = await Sector.create({
                    description: sector
                });

                // Create Unit
                const newUnit = await Unit.create({
                    description: description,
                    address: address,
                    city: city,
                    cep: cep,
                    phone: phone,
                    sector_id: newSector.id // Use the newly created sector's ID
                });

                // Create Employee
                const newEmployee = await Employee.create({
                    name: name,
                    cpf: cpf,
                    email: email,
                    unit_id: newUnit.id, // Use the newly created unit's ID
                    sector_id: newSector.id
                });

                // Create Profile
                const newProfile = await Profile.create({
                    description: profile
                });

                // Create User
                const newUser = await User.create({
                    login: email,
                    password: hash,
                    active: 1,
                    profile_id: newProfile.id, // Use the newly created profile's ID
                    employee_id: newEmployee.id // Use the newly created employee's ID
                });

                // Create Permissions
                await Permissions.create({
                    open_request: open_request,
                    attach_nf: attach_nf,
                    attach_doc: attach_doc,
                    attach_charge: attach_charge,
                    receipt_attachment: receipt_attachment,
                    commercial_authorization: commercial_authorization,
                    financial_authorization: financial_authorization,
                    validation: validation,
                    closure: closure,
                    user_registration: user_registration,
                    employee_id: newEmployee.id,
                    profile_id: newProfile.id,
                    user_id: newUser.id // Use the newly created user's ID
                });


                Token.destroy({
                    where: {
                        [Op.or]: [
                            { managers: token },
                            { leaders: token },
                            { directors: token },
                            { purchases: token },
                            { financial: token },
                            { ti: token }
                        ]
                    }
                }
                ).then(() => {
                    console.log('Tokens deleted successfully.');
                    res.redirect('/?success=true');
                    return;
                }).catch((err) => {
                    console.log(err);
                });

            } catch (error) {
                console.error('Error creating user:', error);

            }

        } else {

            res.redirect('/?error=true');
            return;

        }
    }).catch((err) => {
        console.log(err);
    });
});


module.exports = router;