const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { v4: uuid } = require('uuid');
const { init } = require('./token.model');

const studentSchema = mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
  },
  userType: {
    type: String,
    enum: ['STUDENT', 'STAFF'],
  },
  role: [
    {
      roleId: { type: Number },
      roleName: { type: String },
    },
  ],
  firstName: {
    type: String,
    required: [true, 'firstName is required'],
  },
  lastName: {
    type: String,
    required: [true, 'lastName is required'],
  },
  mobileNo: {
    type: Number,
    unique: [true, 'mobileNo is already present'],
    minlength: 10,
    required: [true, 'mobile No is required'],
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    unique: [true, 'email Id is already present'],
    validator(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is inValid');
      }
    },
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minlength: 8,
    validate(value) {
      if (!value.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)) {
        throw new Error('password must contain At least one lower case and At least one upper case English letter and 1 number');
      }
    },
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'EMAIL_VERIFICATION_PENDING'],
  },
  address: {
    street1: String,
    street2: String,
    city: String,
    state: String,
    country: String,
    zipcode: Number,
  },
  aadhar: {
    type: Number,
  },
  documents: [
    {
      typeOfDoc: {
        type: String,
        unique: true,
        enum: ['ADHAR', 'PANCARD', 'VOTERID', 'PROFILEPIC'],
      },
      fileName: { type: String, unique: true },
    },
  ],
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  _md: {
    createdDtm: { type: Date, default: Date.now },
    createdBy: { type: String },
    modifiedDtm: { type: Date },
    modifiedBy: { type: String },
    studentType: { type: String },
  },
});

// add plugin that converts mongoose to json
studentSchema.plugin(toJSON);
studentSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The student's email
 * @param {ObjectId} [excludestudentId] - The id of the student to be excluded
 * @returns {Promise<boolean>}
 */
studentSchema.statics.isEmailTaken = async function (email, excludestudentId) {
  const student = await this.findOne({ email, _id: { $ne: excludestudentId } });
  return !!student;
};

/**
 * Check if mobileNo is taken
 * @param {Number} mobileNo - the student's mobileNo
 * @returns {Promise<boolean}
 */
studentSchema.statics.isMobileNoTaken = async function (mobileNo) {
  const student = await this.findOne({ mobileNo });
  return !!student;
};

/**
 * Check if password matches the student's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
studentSchema.methods.isPasswordMatch = async function (oldPassword) {
  const student = this;
  return bcrypt.compare(oldPassword, student.password);
};

studentSchema.pre('save', async function (next) {
  const student = this;
  if (student.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(student.password, salt);
  }
  next();
});

studentSchema.pre('save', function (next) {
  if (this.isNew) {
    const { studentId } = this;
    if (!studentId || typeof studentId !== 'string') {
      this.studentId = uuid();
    }
    this._md = {
      ...this._md,
      createdBy: this.studentId,
      createdDtm: new Date(),
    };
  }
  next();
});

studentSchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  console.log(docToUpdate);
  this._update = {
    ...this._update,
    '_md.modifiedDtm': new Date(),
    '_md.modifiedBy': docToUpdate.studentId,
    '_md.studentType': docToUpdate.studentType,
  };
  next();
});

/**
 * @typedef student
 */
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
