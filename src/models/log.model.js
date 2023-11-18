const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const logSchema = new mongoose.Schema({
  level: String,
  message: String,
  resourceId: String,
  timestamp: Date,
  traceId: String,
  spanId: String,
  commit: String,
  metadata: {
      parentResourceId: String
  }
});
// add plugin that converts mongoose to json
logSchema.plugin(toJSON);
logSchema.plugin(paginate);


const Log = mongoose.model('Log', logSchema);

module.exports = Log;
