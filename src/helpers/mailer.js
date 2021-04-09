const nodemailer = require('nodemailer')
const { HOST, PORT, USER, PASS } = process.env

const transporter = nodemailer.createTransport({
  host: `${HOST}`,
  secure: false,
  port: `${PORT}`,
  auth: {
    user: `${USER}`,
    pass: `${PASS}`
  },
  tls: {
    rejectUnauthorized: false
  }
})

module.exports = transporter
