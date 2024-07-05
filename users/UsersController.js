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
const { Op } = require('sequelize');

router.get('/registration', (req, res) => {

    res.render('registrations/index.ejs');

});

router.get('/users', (req, res) => {

    res.render('users/index.ejs');

});

/*
router.get('/login', (req, res) => {

    res.render('users/login.ejs');

});*/

router.get('/registrations_token', (req, res) => {

    res.render('registrationsToken/index.ejs');

});

router.get('/dashboard', (req, res) => {

    res.render('dashboard/index.ejs');

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
                { financial: token }
            ]
        }
    }).then( tipo => {
    if(tipo == undefined){

        console.log(profile);
        res.redirect('/?error=true');
 
    }else{

        console.log(`Profile: ${profile} Token: ${token}`);
        res.render('registrations/index', { profile: profile, token: token });
        
    }
});  

});

router.post('/registration/create', async(req, res) => {

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
                            { financial: token }
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