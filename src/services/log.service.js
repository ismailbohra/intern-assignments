const httpStatus = require('http-status');
const { Log } = require('../models');
const ApiError = require('../utils/ApiError');
const Constants = require('../utils/Constants');
const pick = require('../utils/pick');

const registerlog = async (userBody) => {
  const session = await Log.startSession();
  try {
    session.startTransaction();

    const user = await Log.create(userBody);
    if (!user) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }

    await session.commitTransaction();
  } catch (error) {
    console.error('log insert service has error', error.message);
    await session.abortTransaction();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  } finally {
    session.endSession();
  }
};

const getlog = async (req) => {
  try {
    const filter = pick(req.query, ['level', 'message', 'resourceId', 'timestamp', 'traceId', 'spanId', 'commit']);
    // const options = pick(req.query, ['sortBy', 'limit', 'page']);
    // options.sort = '_md.createdDtm:-1';
    if (req.query.parentResourceId) {
      filter.metadata = {};
      filter['metadata']['parentResourceId'] = new RegExp(req.query.parentResourceId, 'i');;
    }
    console.log(filter)
    const user = await Log.find(filter);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'log Not Found');
    }
    return user;
  } catch (error) {
    console.error('log Service -> getAll got error ' + error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
  }
};

module.exports = {
  registerlog,
  getlog,
};
