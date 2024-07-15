const express = require('express')
const router = express.Router()
const Supplier = require('./Supplier')



router.get('/suppliers', async (req, res) => {

    const suppliers = await Supplier.findAll();

    res.render('suppliers/index.ejs',{user: req.session.user, suppliers: suppliers});

});

module.exports = router;