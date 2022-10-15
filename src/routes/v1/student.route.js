const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validate');
const studentValidation = require('../../validations/student.validation');
const studentController = require('../../controller/student.controller');
const { verifyToken } = require('../../middlewares/Jwt');

router.route('/').post(validate(studentValidation.registerStudent), studentController.registerStudent); //create a new student
router.route('/').get(studentController.getStudent); //get all students
router.route('/').put(); // update a student
router.route('/').delete(); // delete a student
router.route('/login').post(validate(studentValidation.login), studentController.login); // student login
router.route('/logout').post(verifyToken, studentController.logout); // student logout
router.route('/verifyOtp').post(studentController.checkOtp); //Verify Otp
router.route('/resendVerificationOtp').post(studentController.resendVerificationOtp); // resendVerificationOTP
router.route('/changePassword').put(verifyToken, validate(studentValidation.changePassword), studentController.changePassword); //changepassword
router.route('/forgotPassword/:email').get(studentController.forgotPassword); //forgetpassword
router.route('/resetPassword').post(validate(studentValidation.resetPassword), studentController.resetPassword); //resetpassword

//Below routes are used to upload documents to server
router.route('/uploadDoc/:typeOfDoc').put(verifyToken, validate(studentValidation.uploadDoc), studentController.uploadDoc);
//router.route('/removeDoc/:typeOfDoc').delete(verifyToken, userController.removeDoc);
//router.route('/updateKycDocs').put(verifyToken, validate(userValidation.updateKycDocs), userController.updateKycDocs);

module.exports = router;
