const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  // Constructor function it's the function that's gonna be running when a new object is created through this class
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    // Each object created from this class will then get this property
    this.from = `Daniel Vazquez <${process.env.EMAIL_FROM}>`;
  }

  // Method in order to create the transport
  newTransport() {
    // Different transports whether we are in prod or not
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      return 1;
    }

    // 1) Create a transporter
    // Service that actually send the email via nodemailer
    return nodemailer.createTransport({
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
  }

  // Creating send method which will do the actual sending. Will receive template and subject
  async send(template, subject) {
    // 1) Render HTML for the email based on a pug template
    const html = pug.renderFile(`${__dirname}../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      // Also specify html property converting the message to html
      html,
      text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // Creating different emails for diff situations
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Fight Club! :v');
  }
};
