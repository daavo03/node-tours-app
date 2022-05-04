const nodemailer = require('nodemailer');

// Creating email handler function
const sendEmail = async options => {
  // 1) Create a transporter
  // Service that actually send the email via nodemailer
  const transporter = nodemailer.createTransport({
    /* 
    Sending via Gmail
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    Then in Gmail activate "less secure app" option, SendGrid|Mailgun  
    */
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Daniel Vazquez <daavo.1002@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // Also specify html property converting the message to html
    // html:
  };

  // 3) Actually send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
