const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { successResponseGenerator, errorResponse } = require('../utils/ApiHelpers');

const { logService } = require('../services');

const addLog = catchAsync(async (req, res) => {
  try {
    await logService.registerlog(req.body);
    res.status(httpStatus.CREATED).send(successResponseGenerator(httpStatus.CREATED, 'log inserted successfully'));
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(errorResponse(httpStatus.BAD_REQUEST, error.message));
  }
});
const getLog = catchAsync(async (req, res) => {
  try {
    const log = await logService.getlog(req);
    res.status(httpStatus.OK).send(successResponseGenerator(httpStatus.OK, 'log get Successful', log));
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(errorResponse(httpStatus.BAD_REQUEST, error.message));
  }
});


module.exports = {
  addLog,
  getLog,
};
