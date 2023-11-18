const express = require('express');
const router = express.Router();
const logcontroller = require('../../controller/log.controller');

router.route('/').post(logcontroller.addLog);
router.route('/').get(logcontroller.getLog); 

module.exports = router;
