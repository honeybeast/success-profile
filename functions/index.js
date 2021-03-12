const serverless = require('serverless-http');
const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const path = require('path');

const app = express();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const { smtpHost, smtpUser, smtpPass } = process.env;

const mailTransport = nodemailer.createTransport({
  host: smtpHost,
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const ORIGIN = 'https://marvelous-milos.herokuapp.com';
const MAX_EMAIL_LENGTH = 512;
const MAX_MESSAGE_LENGTH = 4096;

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: ORIGIN }));
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.post('/message', async (req, res) => {
  try {
    const email = DOMPurify.sanitize(req.body.email);
    const message = DOMPurify.sanitize(req.body.message);

    // Validate email request
    if (!email || !/(.+)@(.+){2,}\.(.+){2,}/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    } else if (!message) {
      return res.status(400).json({ error: 'Please enter a message' });
    } else if (email.length > MAX_EMAIL_LENGTH) {
      return res.status(400).json({
        error: `Please enter an email fewer than ${MAX_EMAIL_LENGTH} characters`,
      });
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Please enter a message fewer than ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    // Send email
    const mailOptions = {
      from: `Portfolio <mailbot@marvelous-milos.herokuapp.com>`,
      to: 'babystar.shine2019@gmail.com',
      subject: `New message from ${email}`,
      text: `From: ${email}\n\n${message}`,
    };

    await mailTransport.sendMail(mailOptions);

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Rejected', error);
    return res.status(500).json({ error: 'Message rejected' });
  }
});

app.listen(process.env.PORT || 4000);

module.exports.handler = serverless(app);