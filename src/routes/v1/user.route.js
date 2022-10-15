const express = require('express');


const router = express.Router();

router.route('/').post();
router.route('/').get();

module.exports = router;
