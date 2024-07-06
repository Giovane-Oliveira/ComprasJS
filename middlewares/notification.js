function notificationUser(req, res, next){
 //login noitifications
    if (req.query.success) {
        res.render('users/login.ejs', { message: 'Registro efetuado com sucesso' });
        next();
      } else if (req.query.error) { 
        res.render('users/login.ejs', { message: 'Este email já está registrado ou link inválido!' });
        next();
      } else if (req.query.recover) { 
        res.render('users/login.ejs', { message: 'Senha alterada com sucesso!' });
        next();
      }else if (req.query.recover_error) {
        res.render('users/login.ejs', { message: 'Erro ao alterar a senha!' });
        next();
      }else if (req.query.sendmail) {
        res.render('users/login.ejs', { message: 'Email de recuperação de senha enviado!' });
        next();
      }else if (req.query.error_send_mail) {
        res.render('users/login.ejs', { message: 'Erro ao enviar email de recuperação de senha!' });
        next();
      }else {
        res.render('users/login.ejs', { message: '' });
         next();
      }


}

module.exports = notificationUser;