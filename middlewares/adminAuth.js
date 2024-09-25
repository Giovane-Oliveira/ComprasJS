function adminAuth(req, res, next){
    if(req.session.user != undefined){
        next();
    }else{
        //redireciona para o dashboard dos chamados
        res.redirect('/');
    }   
}

module.exports = adminAuth;