const jwt = require('jsonwebtoken');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '300m';
const JWT_SECRET_CODE = process.env.JWT_SECRET || 'secret';

const jwtEncode = (id, email) => {
  return jwt.sign({ id: id, email: email }, JWT_SECRET_CODE, {
    expiresIn: '300m',
    // algorithm: "ES512"
  });
};

const jwtDecode = (token) => {
  return jwt.verify(token, JWT_SECRET_CODE);
};

module.exports = {
  jwtEncode,
  jwtDecode,
};
