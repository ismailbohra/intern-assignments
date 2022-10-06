const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const ejs = require('ejs');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  try {
    const msg = { from: config.email.from, to, subject, text };
    await transport.sendMail(msg);
  } catch (error) {
    console.error('sendEmail service has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (emailSubject, to, token) => {
  try {
    const subject = emailSubject;
    // replace this url with the link to the reset password page of your front-end app
    const text = `Dear user,
      To reset your password, please enter this OTP on CSX:
      ${token.token}
      If you did not request any password resets, please check your account as soon as possible.`;
    await sendEmail(to, subject, text);
  } catch (error) {
    console.error('sendResetPasswordEmail service --> has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, url) => {
  try {
    const subject = 'Email Verification';
    // replace this url with the link to the email verification page of your front-end app
    // const verificationEmailUrl = token;
    // html: '<p><b>To finish setting up this GoGaddiGo account, we just need to make sure this email address is yours.</b></p>' +
    //   '<br><br>' +
    //   '<p> Verify ' +
    //   url +
    //   '</p>';
    const text = `Dear user,
      To verify your email, click on this link: ${url}
      If you did not create an account, then ignore this email.`;
    await sendEmail(to, subject, text);
    return;
  } catch (error) {
    console.error('sendVerificationEmail service has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const sendVerificationOTP = async (subject, to, otp, industryName) => {
  try {
    // replace this url with the link to the email verification page of your front-end app
    // const verificationEmailUrl = token;
    const text = `Dear user,
      Thank You for registering your industry on CSX.
      If you or your authorised agent added ${industryName} , Please enter the following OTP on CSX.
      ${otp}
      If you did not create an account, then ignore this email.`;
    await sendEmail(to, subject, text);
    return;
  } catch (error) {
    console.error('sendVerificationEmail service has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const sendUserVerificationOTP = async (subject, to, otp) => {
  try {
    // replace this url with the link to the email verification page of your front-end app
    // const verificationEmailUrl = token;
    const text = `Dear user,
      Welcome to CSX!
      To continue using portal, please verify your account on CSX with the following OTP:.
      ${otp}

      If you have not performed this action, Please reach out to CSX Support on: help@csx.com
      `;
    await sendEmail(to, subject, text);
    return;
  } catch (error) {
    console.error('sendVerificationEmail service has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendVerificationOTP,
  sendUserVerificationOTP,
};
