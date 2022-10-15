const httpCode = require('http-status');
const multer = require('multer');
const path = require('path');
const { successResponseGenerator, errorResponse } = require('../utils/ApiHelpers');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, req.type + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg') {
      cb(null, true);
    } else {
      cb('Only .png, .jpg and .jpeg format allowed!', false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
}).single('go');

const uploadImg = async (req, res) => {
  try {
    upload(req, res, function (err) {
      if (err) {
        var error = {
          error: err,
        };
        res.status(httpCode.BAD_REQUEST).send(errorResponse(httpCode.BAD_REQUEST, error.message));
      }
      var result = {
        fileName: req.file.filename,
      };
      res.status(httpCode.OK).send(successResponseGenerator(httpCode.OK, 'upload successfully', result));
    });
  } catch (error) {
    res.status(httpCode.INTERNAL_SERVER_ERROR).send(errorResponse(httpCode.INTERNAL_SERVER_ERROR, error.message));
  }
};

const uploadDocs = async (req, res) => {
  return new Promise((resolve, reject) => {
    try {
      uploadDoc(req, res, function (error) {
        error ? reject(error) : resolve(req.file.filename);
      });
    } catch (error) {
      throw new ApiError(httpCode.INTERNAL_SERVER_ERROR, error.message);
    }
  });
};

const uploadDoc = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    var ext = file.originalname.split('.').pop();
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg' ||
      file.mimetype == 'application/pdf' ||
      file.mimetype == 'application/doc' ||
      file.mimetype == 'application/docx' ||
      ext == 'doc' ||
      ext == 'docx'
    ) {
      cb(null, true);
    } else {
      cb('Only .png, .jpg , .jpeg,.pdf, .doc and .docx format allowed!', false);
      return cb(new Error('Only .pdf format allowed!'));
    }
  },
}).single('fileName');

module.exports = {
  uploadImg,
  uploadDocs
};
