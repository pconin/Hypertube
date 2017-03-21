const imageType = require('image-type');

module.exports = {
    auth: function (req, res, next){
        if (!req.session.idunique)
            res.redirect('/');
        else
            next();
    },
    img: function(img){
        if (!img)
            return ("Vous devez uploader une image");
        var type = imageType(img['data']);
        if (img['mimetype'] !== 'image/jpeg' && img['mimetype'] !== 'image/png')
            return "Le fichier doit être une image de type jpg/png";
        else if (type.ext !== 'jpg' && type.ext !== 'png')
            return "Le fichier doit être une image de type jpg/png, l\'extension est mauvaise";
        else if (img.length > 15000)
            return ('Image trop grande');
        else
            return null;
        
    },
    
    mail:function checkmail(mail)
    {
        var re = /^[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}/;
        if (!mail)
            return ("Fill all fieds #520");
        if (mail.length < 6 || mail.length > 254)
            return ("Check the length for your mail");
        else if (!re.test(mail))
            return ("Wrong mail address");
        return null;
    },
    url:function checkurl(url)
    {
        var re = /^(http:\/\/)|(https:\/\/).+/;
        if (!url)
            return ("Fill all fieds  #521");
        else if (!re.test(url))
            return ("URL is incorect (begin with : http:// or https://)");
        return null;
    },
    login:function checkname(nom, prenom, login){
            if (!nom || !prenom || !login)
                return ("Les champs login nom et prenom sont obligatoires.");
            else if (nom.length < 2 || nom.length > 20 || prenom.length < 2 || prenom.length > 20)
                return ("Les noms et prenoms doivent faire entre 2 et 20 caractères.");
            else if (login.length < 2 || login.length > 20)
                return ("Le login faire entre 2 et 20 caractères.");
            var re = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/;
            var logre = /^[a-zA-Z0-9]+$/;
            if(!re.test(nom) || !re.test(prenom)) 
                return("Le nom/prenom n'est pas correct.");
            else if (!logre.test(login))
                return("Le login ne doit contenir que des lettres et des chiffres.");
            else
                return null ;
        },
        name:function checkname2(nom, prenom){
            if (!nom || !prenom)
                return ("Les champs login nom et prenom sont obligatoires.");
            else if (nom.length < 2 || nom.length > 20 || prenom.length < 2 || prenom.length > 20)
                return ("Les noms et prenoms doivent faire entre 2 et 20 caractères.");
            var re = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/;
            if(!re.test(nom) || !re.test(prenom)) 
                return("Le nom/prenom n'est pas correct.");
            else
                return null ;
        },
        
    login2:function checkname(login){
            if (!login)
                return ("Les champs login est obligatoires.");
            if (login.length < 2 || login.length > 20)
                return ("Le login faire entre 2 et 20 caractères.");
            var logre = /^[a-zA-Z0-9]+$/;
            if (!logre.test(login))
                return("Le login ne doit contenir que des lettres et des chiffres.");
            return null ;
        },
        
    pwd:function checkpassword(pwd, pwd2)
    {
        var nb = /[0-9]/;
        var alpha = /[a-z]/;
        
        if (!pwd)
            return ("Fill all fields  #522");
        if (!pwd2)
            return ("Fill all fields  #523");
        if (pwd !== pwd2)
            return ("both password doesn't correspond");
        else if (pwd.length < 6 || pwd.length > 30)
            return ("Your password must be between 6 and 30 characters long and at least one digit");
        if(!nb.test(pwd)) {
            return ("Password must contain at least one number (0-9)!");
        }
        if(!alpha.test(pwd)) {
            return ("Password must contain at least one letter (a-z)!");
        }
        return null;
    },
    
    pwd2:function checkupdatepassword(actuel, voulu, confirm)
    {
        var nb = /[0-9]/;
        var alpha = /[a-z]/;
        
        if (!actuel)
            return ("Fill all fields  #522");
        if (!voulu)
            return ("Fill all fields  #523");
        if (!confirm)
            return ("Fill all fields  #523");
        if (voulu !== confirm)
            return ("both password doesn't correspond");
        else if (voulu.length < 6 || voulu.length > 30)
            return ("Your password must be between 6 and 30 characters long and at least one digit");
        if(!nb.test(voulu)) {
            return ("Password must contain at least one number (0-9)!");
        }
        if(!alpha.test(voulu)) {
            return ("Password must contain at least one letter (a-z)!");
        }
        return null;
    },
    
    lang:function checklang(lang)
    {
        if (lang === 'fr' || lang === 'en')
            return (null);
        return ('Only English or French');
    },
    
    choixlang:function choixlang(lang, en, fr)
    {
        if (lang === 'fr')
            return (fr);
        return (en); //par defaut
    },
    
    newpwd:function newpasspord()
    {
        var pwd = Math.random().toString(36).slice(4);
        return pwd;
    }
}