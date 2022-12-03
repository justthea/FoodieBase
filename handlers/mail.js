//nodemailer will interface with SMTP(transports) and will send email for u
const nodemailer = require("nodemailer");
const pug = require("pug");
const juice = require("juice"); //inline css for us
const htmlToText = require("html-to-text");
const promisify = require("es6-promisify");

const transport = nodemailer.createTransport({
  // host is taken from the env file
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

//send email with transport to test the transport
// transport.sendMail({
//   from: "Thea Xing <xingjingtong123@gmail.com>",
//   to: "dbw@dev.com",
//   subject: "Just trying things out",
//   html: "Hey I <strong>love</strong> you",
//   text: "Hey I **love you**",
// });

const generateHTML = (filename, options = {}) => {
  //dirname = the current directory we are render this file from (harddrive )
  //we need the name of the file (password.pug), but we dont know wehere we r in the folder system, bc renderfile is in a diff folder
  const html = pug.renderFile(
    `${__dirname}/../views/email/${filename}.pug`,
    options
  );
  const inlined = juice(html);
  return inlined;
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: "Wes Bos <noreply@wesbos.com>",
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
