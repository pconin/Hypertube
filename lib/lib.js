module.exports = {
    sendMail: function(mail, sujet, message, api_key) {
        var helper = require('sendgrid').mail;
        var from_email = new helper.Email('noreply@hypertube42.fr');
        var to_email = new helper.Email(mail);
        var content = new helper.Content('text/plain', message);
        var mail = new helper.Mail(from_email, sujet, to_email, content);
        var sg = require('sendgrid')('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');
        var request = sg.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON(),
        });
        
        sg.API(request, function(error, response) {
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
        });
    }
};