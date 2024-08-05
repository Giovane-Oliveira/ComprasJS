const express = require('express')
const router = express.Router()
const Supplier = require('./Supplier');
const adminAuth = require('../middlewares/adminAuth');


router.get('/suppliers', adminAuth, async (req, res) => {

    const suppliers = await Supplier.findAll();

    res.render('suppliers/index.ejs', { user: req.session.user, suppliers: suppliers});

});

router.get('/suppliers_register', adminAuth, async (req, res) => {

    res.render('suppliers/register.ejs', { user: req.session.user, message: '' });

});


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


})

router.post('/register_supplier', adminAuth, (req, res) => {
    const name = req.body.name;
    const cnpj = req.body.cnpj;

    Supplier.create({
        name: name,
        cnpj: cnpj
    }).catch(err => {
            console.log(err);
            res.render('suppliers/register.ejs', { user: req.session.user, message: 'Erro ao cadastrar o fornecedor' });
            // Handle the error appropriately, e.g., display an error message to the user
        });

    res.render('suppliers/register.ejs', { user: req.session.user, message: 'Fornecedor cadastrado com sucesso!' });

});

module.exports = router;