const express = require('express')
const router = express.Router()
const Supplier = require('./Supplier');
const adminAuth = require('../middlewares/adminAuth');
const { where } = require('sequelize');

//Busca os fornecedores e encaminha para página
router.get('/suppliers', adminAuth, async (req, res) => {

    const suppliers = await Supplier.findAll();

    res.render('suppliers/index.ejs', { user: req.session.user, suppliers: suppliers});

});

router.get('/suppliers_register', adminAuth, async (req, res) => {

    res.render('suppliers/register.ejs', { user: req.session.user, message: '' });

});

//Ativar fornecedor
router.get('/activate_supplier/:id', adminAuth, (req, res) => {

    const id = req.params.id;

    Supplier.update({
        status: 1
    }, {
        where: {
            id: id
        }
    }).then(() => {
        res.redirect('/suppliers');
    }).catch(err => {
        console.log(err);
    });

});

//Desativar fornecedor
router.get('/desactivate_supplier/:id', adminAuth, (req, res) => {

    const id = req.params.id;

    Supplier.update({
        status: 0
    }, {
        where: {
            id: id
        }
    }).then(() => {
        res.redirect('/suppliers');
    }).catch(err => {
        console.log(err);
    });

});

//Deletar Fornecedor
router.get('/delete_supplier/:id', adminAuth, (req, res) => {

    const id = req.params.id;

    Supplier.destroy({
        where: {
            id: id
        }
    }).then(() => {
        res.redirect('/suppliers');
    }).catch(err => {
        console.log(err);
    });

});

//Registrar Fornecedor
router.post('/register_supplier', adminAuth, (req, res) => {
    const name = req.body.name;
    const cnpj = req.body.cnpj;
    const cpf = req.body.cpf;
    var pessoa = "";
    console.log("CPF: " + cpf);
    console.log("CNPJ: " + cnpj);

if(cnpj != undefined){

    pessoa = cnpj
    
}else{

    pessoa = cpf

}

    Supplier.findOne({
        where:{
            cnpj: pessoa
        }
    }).then(resultado =>{

        if(resultado == undefined){

            Supplier.create({
                name: name,
                cnpj: pessoa
            }).catch(err => {
                    console.log(err);
                    res.render('suppliers/register.ejs', { user: req.session.user, message: 'Erro ao cadastrar o fornecedor' });
                    // Handle the error appropriately, e.g., display an error message to the user
                });
        
            res.render('suppliers/register.ejs', { user: req.session.user, message: 'Fornecedor cadastrado com sucesso!' });

        }else{

            res.render('suppliers/register.ejs', { user: req.session.user, message: 'Fornecedor já cadastrado!' });

        }

    });

    

});

module.exports = router;