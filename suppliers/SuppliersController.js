const express = require('express')
const router = express.Router()



router.get('/suppliers', (req, res) => {

    res.render('suppliers/index.ejs',{user: req.session.user});

});

module.exports = router;