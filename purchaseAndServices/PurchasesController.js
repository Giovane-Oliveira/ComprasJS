const express = require('express')
const router = express.Router()

router.get('/purchases', (req, res) => {
    res.render('purchaseAndServices/index.ejs', {user: req.session.user});
});

module.exports = router;
