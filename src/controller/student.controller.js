const httpStatus = require('http-status');
const path = require('path');
const catchAsync = require('../utils/catchAsync');
const { ACTIVE, INACTIVE } = require('../utils/Constants');
const bcrypt = require('bcryptjs');
const { successResponseGenerator, errorResponse } = require('../utils/ApiHelpers');

const { User } = require('../models');
const { studentService } = require('../services');

const registerStudent = catchAsync(async (req, res) => {
  try {
    await studentService.registerStudent(req.body);
    res.status(httpStatus.CREATED).send(successResponseGenerator(httpStatus.CREATED, 'Student created successfully', req.body.email));
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(errorResponse(httpStatus.BAD_REQUEST, error.message));
  }
});
const getStudent = catchAsync(async (req, res) => {
  try {
    const user = await studentService.getStudent(req);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Student List Successful', user));
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(errorResponse(httpStatus.BAD_REQUEST, error.message));
  }
});
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await studentService.loginUserWithEmailAndPassword(email, password);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Login Successful', user));
  } catch (error) {
    res.status(error.statusCode).send(errorResponse(error.statusCode, error.message, email));
  }
});
const logout = catchAsync(async (req, res) => {
  try {
    await studentService.logout(req.id);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'User logout successfully'));
  } catch (error) {
    res.status(error.statusCode).send(errorResponse(error.statusCode, error.message));
  }
});
const checkOtp = catchAsync(async (req, res) => {
  try {
    const { email, otp } = req.body;
    await studentService.checkOtp(otp, email);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Email Verification successful'));
  } catch (error) {
    if (error.message === 'Token Invalid') res.status(httpStatus.UNAUTHORIZED).send(errorResponse(httpStatus.UNAUTHORIZED, error.message));
    else res.status(httpStatus.INTERNAL_SERVER_ERROR).send(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
  }
});
const resendVerificationOtp = catchAsync(async (req, res) => {
  try {
    await studentService.resendVerificationOtp(req.body.email);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Verification Link Sent Successfully', req.body.email));
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(errorResponse(httpStatus.BAD_REQUEST, error.message));
  }
});
const changePassword = catchAsync(async (req, res) => {
  try {
    await studentService.changePassword(req.body, req.id);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Password Updated successfully'));
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(errorResponse(httpStatus.BAD_REQUEST, error.message));
  }
});
const forgotPassword = catchAsync(async (req, res) => {
  try {
    const user = await studentService.forgotPassword(req.params.email);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'OTP Sent to: ' + req.params.email, user.email));
  } catch (error) {
    res.status(error.statusCode).send(errorResponse(error.statusCode, error.message));
  }
});
const resetPassword = catchAsync(async (req, res) => {
  try {
    await studentService.resetPassword(req.body);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Password successfully Reset. Please Login Again!'));
  } catch (error) {
    res.status(error.statusCode).send(errorResponse(error.statusCode, error.message));
  }
});

const uploadDoc = catchAsync(async (req, res) => {
  try {
    await studentService.uploadDoc(req, res);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'Doc uploaded successfully'));
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
  }
});

module.exports = {
  registerStudent,
  getStudent,
  login,
  logout,
  checkOtp,
  resendVerificationOtp,
  changePassword,
  forgotPassword,
  resetPassword,
  uploadDoc,
};
