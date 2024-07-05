const express = require('express')
const router = express.Router()

router.get('/purchases', (req, res) => {
    res.render('purchaseAndServices/index.ejs');
});

module.exports = router;
