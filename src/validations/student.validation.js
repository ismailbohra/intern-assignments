const Joi = require('joi');
const { passwordValidation, objectId, validEmail, validNumber, validAadharNumber } = require('./custom.validation');

const registerStudent = {
  body: Joi.object().keys({
    userType: Joi.string().required(),
    firstName: Joi.string()
      .required()
      .uppercase()
      .min(0)
      .max(30)
      .pattern(/^[a-zA-Z\s]*$/)
      .message('FirstName should be less than 30 characters and no special characters'),
    lastName: Joi.string()
      .required()
      .uppercase()
      .min(0)
      .max(30)
      .pattern(/^[a-zA-Z\s]*$/)
      .message('LastName should be less than 30 characters and no special characters'),
    mobileNo: Joi.number().required().min(1000000000).max(9999999999).messages(validNumber('MobileNo')),
    email: Joi.string().required().email().messages(validEmail('Email')),
    password: Joi.string().required().custom(passwordValidation),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email().messages(validEmail('Email')),
    password: Joi.string().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(passwordValidation),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email().messages(validEmail('Email')),
    otp: Joi.number().required(),
    newPassword: Joi.string().required().custom(passwordValidation),
  }),
};

const updateProfile = {
  body: Joi.object().keys({
    firstName: Joi.string()
      .uppercase()
      .min(0)
      .max(30)
      .pattern(/^[a-zA-Z\s]*$/)
      .message('FirstName should be less than 30 characters and no special characters'),
    lastName: Joi.string()
      .uppercase()
      .min(0)
      .max(30)
      .pattern(/^[A-Z]+$/)
      .message('LastName should be less than 30 characters and no special characters'),
    mobileNo: Joi.number().min(1000000000).max(9999999999).messages(validNumber('MobileNo')),
    email: Joi.string().email().messages(validEmail('Email')),
    address: Joi.object().keys({
      street1: Joi.string().required().uppercase(),
      street2: Joi.string().uppercase().optional(),
      city: Joi.string().required().uppercase().min(1).max(20).message('city should be less than 20 characters'),
      state: Joi.string().required().uppercase().min(1).max(20).message('state should be less than 20 characters'),
      country: Joi.string().optional().default('INDIA').uppercase().min(1).max(20).message('country should be less than 20 characters'),
      zipcode: Joi.number().integer().required().min(100000).max(999999).message('Invalid Zip Code'),
    }),
  }),
};

const uploadDoc = {
  params: Joi.object().keys({
    typeOfDoc: Joi.string().valid('PHOTO', 'DOCUMENT'),
  }),
};

module.exports = {
  registerStudent,
  getUser,
  login,
  changePassword,
  resetPassword,
  updateProfile,
  uploadDoc,
};
