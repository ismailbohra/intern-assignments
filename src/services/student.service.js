const httpStatus = require('http-status');
const { Student, Token, AdminUser } = require('../models');
const ApiError = require('../utils/ApiError');
const { emailService } = require('.');
const { jwtEncode } = require('../middlewares/authorization');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { uploadDocs } = require('./upload.service');
const Constants = require('../utils/Constants');
const { v4: uuid } = require('uuid');
const { filter } = require('compression');
const Singleton = require('../config/redis.config');
const redis = Singleton.getInstance();
const fs = require('fs');
const { EMAIL_VERIFICATION_PENDING } = require('../utils/Constants');
const pick = require('../utils/pick');

const registerStudent = async (userBody) => {
  const session = await Token.startSession();
  try {
    session.startTransaction();
    if (await Student.isEmailTaken(userBody.email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, userBody.email + ' is already taken. Please try with different Email for login');
    }
    if (await Student.isMobileNoTaken(userBody.mobileNo)) {
      throw new ApiError(httpStatus.BAD_REQUEST, userBody.mobileNo + ' already exists. Please try with another Mobile Number for login');
    }
    userBody.status = Constants.EMAIL_VERIFICATION_PENDING;
    const user = await Student.create(userBody);
    if (!user) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
    const otp = Math.floor(10000000 + Math.random() * 90000000);
    let token = {
      userId: user.studentId,
      email: user.email,
      token: otp.toString(),
    };
    await Token.create(token);
    await emailService.sendUserVerificationOTP('CMS - Email Verification', user.email, otp, user.email);
    await session.commitTransaction();
  } catch (error) {
    console.error('User create service has error', error.message);
    await session.abortTransaction();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  } finally {
    session.endSession();
  }
};
const checkOtp = async (otp, email) => {
  const session = await Token.startSession();
  try {
    session.startTransaction();
    const user = await Student.findOne({ email });
    if (user.isEmailVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email Already Verified');
    }
    const token = await Token.findOne({
      email: user.email,
      token: otp.toString(),
    });
    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'INVALID OTP');
    }
    await Student.findOneAndUpdate({ email: user.email }, { isEmailVerified: true, status: Constants.VERIFIED });
    await Token.findOneAndRemove({ email: user.email, token: otp.toString() });
    await session.commitTransaction();
  } catch (error) {
    console.error('checkOtp -> error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  } finally {
    session.endSession();
  }
};
const getStudent = async (req) => {
  try {
    const filter = pick(req.query, ['isEmailVerified', 'mobileNo']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    options.sort = '_md.createdDtm:-1';
    const user = await Student.paginate(filter, options, { password: 0 });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Student Not Found');
    }
    return user;
  } catch (error) {
    console.error('Student Service -> getAll got error ' + error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
  }
};
const loginUserWithEmailAndPassword = async (email, password) => {
  try {
    const user = await Student.findOne({ email });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Login Failed! Incorrect email');
    else if (!user.isEmailVerified) throw new ApiError(httpStatus.OK, 'Account Verification Pending. Please Verify Your Email!');
    else if (user.isBlocked) throw new ApiError(httpStatus.OK, 'Account Blocked..!! Please contact CMS Support!');
    else if (!(await user.isPasswordMatch(password))) throw new ApiError(httpStatus.UNAUTHORIZED, 'Login Failed! Incorrect password');

    const token = jwtEncode(user.studentId, email);
    const tokenExpiringAt = moment().add(30, 'minutes').unix();

    //redis implementation for login/logout time is in seconds
    const userId = user.studentId;
    const redisToken = token.toString();
    await redis.setValues(`${userId}`, 7200, `${redisToken}`);

    const userType = user.userType;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const mobileNo = user.mobileNo;
    return {
      userType,
      firstName,
      lastName,
      mobileNo,
      email,
      token,
      tokenExpiringAt,
    };
  } catch (error) {
    console.error('Login by email service has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
const logout = async (userId) => {
  try {
    await redis.del(userId);
  } catch (error) {
    console.error('Error while logout ::> ' + error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Logout Failed! Try again!');
  }
};
const resendVerificationOtp = async (email) => {
  const user = await Student.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid User');
  }
  if (user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, user.email + ' is Already Verified');
  }
  await Token.findOneAndRemove({ email: user.email, userId: user.studentId });
  const otp = Math.floor(10000000 + Math.random() * 90000000);
  let token = {
    userId: user.studentId,
    email: user.email,
    token: otp.toString(),
  };
  await Token.create(token);
  await emailService.sendUserVerificationOTP('CMS - Email Verification', user.email, otp, user.email);
};
const changePassword = async (body, userId) => {
  try {
    if (body.oldPassword === body.newPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New Password cannot be same as Old Password');
    }
    const user = await Student.findOne({ userId });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (!(await user.isPasswordMatch(body.oldPassword))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Old Password does not match');
    }
    const newPassword = await bcrypt.hash(body.newPassword, 10);
    const userDetails = await Student.findOneAndUpdate({ email: user.email }, { password: newPassword });
    return userDetails;
  } catch (error) {
    console.error('userService -> ' + error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
const forgotPassword = async (email) => {
  try {
    const user = await Student.findOne({ email });
    if (!user) {
      console.error('userService -> EmailId :: ' + email + ' does not exist');
      throw new ApiError(httpStatus.NOT_FOUND, 'EmailId :: ' + email + ' does not exist');
    }
    if (user.isBlocked) {
      console.error('userService -> EmailId :: ' + email + ' is Blocked');
      throw new ApiError(httpStatus.UNAUTHORIZED, email + ' is Blocked..!! Please Contact CMS Support');
    }
    if (!user.isEmailVerified) {
      console.error('userService -> EmailId :: ' + email + ' is Not Verified');
      throw new ApiError(httpStatus.UNAUTHORIZED, email + ' is Not Verified..!! Please check for previous Email Verification mail');
    }
    await Token.findOneAndRemove({ email: user.email });
    const otp = Math.floor(10000000 + Math.random() * 90000000);
    let tokenDB = {
      userId: user.userId,
      email: user.email,
      token: otp.toString(),
    };
    Token.create(tokenDB);
    // const url = `${process.env.BASE_URL}/user/resetPassword/${user.userId}/${token.token}`;
    await emailService.sendResetPasswordEmail('Reset password', user.email, tokenDB);
    return user;
  } catch (error) {
    throw new ApiError(!error.statusCode ? httpStatus.INTERNAL_SERVER_ERROR : error.statusCode, error.message);
  }
};
//This method is used in reset password service
const verifyOtp = async (otp, user) => {
  const session = await Token.startSession();
  try {
    session.startTransaction();
    const token = await Token.findOne({
      email: user.email,
      token: otp.toString(),
    });
    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid OTP..!! ');
    } else {
      await Token.findOneAndRemove({ email: user.email, token: otp.toString() });
    }
    await session.commitTransaction();
  } catch (error) {
    console.error('ERROR:: ' + error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  } finally {
    session.endSession();
  }
};
const resetPassword = async (requestBody) => {
  const session = await Token.startSession();
  try {
    session.startTransaction();
    const user = await Student.findOne({ email: requestBody.email });
    if (!user) {
      console.error('userService -> User :: ' + requestBody.email + ' does not exist');
      throw new ApiError(httpStatus.NOT_FOUND, 'User :: ' + requestBody.email + ' does not exist');
    }

    await verifyOtp(requestBody.otp, user);
    const newPassword = await bcrypt.hash(requestBody.newPassword, 10);
    await Student.findOneAndUpdate({ email: requestBody.email }, { password: newPassword });
    await session.commitTransaction();
  } catch (error) {
    console.error('Reset password has error', error.message);
    await session.abortTransaction();
    throw new ApiError(error.statusCode, error.message);
  } finally {
    session.endSession();
  }
};

const uploadDoc = async (req, res) => {
  try {
    const user = await Student.findOne({ userId: req.id });
    if (!user) {
      //console.error('studentService -> uploadDoc user does not exist');
      throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
    }
    req.type = Constants.USER_DOC_FILE_PREFIX + req.params.typeOfDoc.toUpperCase();
    let fileNameOfDOC = await uploadDocs(req, res)
      .then((fileName) => {
        //console.log('fileName', fileName);
        return fileName;
      })
      .catch((err) => {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
      });
    let documents = user.documents;
    let reqDoc = { _id: uuid(), typeOfDoc: req.params.typeOfDoc.toUpperCase(), fileName: fileNameOfDOC };
    if (documents && documents.length) {
      let index = documents.findIndex((x) => x.typeOfDoc == req.params.typeOfDOC.toUpperCase());
      index === -1
        ? documents.push(reqDoc)
        : (documents = documents.map((doc) => {
            if (doc.typeOfDoc == req.params.typeOfKYC.toUpperCase()) {
              doc.fileName = fileNameOfDOC;
            }
            return {
              _id: doc._id || uuid(),
              typeOfDoc: doc.typeOfDoc,
              fileName: doc.fileName,
            };
          }));
    } else {
      documents.push(reqDoc);
    }
    let $set = {};

    $set.documents = documents;
    // $set.status = Constants.KYC_PENDING;
    await Student.findOneAndUpdate({ userId: req.id }, { $set });
  } catch (error) {
    console.log('uploadKYC has error', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
module.exports = {
  registerStudent,
  getStudent,
  checkOtp,
  loginUserWithEmailAndPassword,
  logout,
  resendVerificationOtp,
  changePassword,
  forgotPassword,
  resetPassword,
  uploadDoc,
};
