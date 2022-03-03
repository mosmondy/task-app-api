
const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = ({ email, name }) => {
    sgMail.send({
        to: email,
        from: 'mosmondy@gmail.com',
        subject: 'Thank you for signing up!',
        text: `Welcome ${name}, let me know what you think of the app. Much thanks.`
    })
}

const sendBuyEmail = ({ email, name }) => {
    sgMail.send({
        to: email,
        from: 'mosmondy@gmail.com',
        subject: 'Your Cancellation',
        text: `Hi ${name}, sad that you cancelled your subscription, please tell us why you cancelled and how we can improve thank you.`
    })
}

module.exports = {
    sendWelcomeEmail, sendBuyEmail
}