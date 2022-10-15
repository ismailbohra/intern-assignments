const { jwtDecode } = require('./authorization');

const Singleton = require('../config/redis.config');
const redis = Singleton.getInstance();

/*
* @summary : Validate the token and return the user
 * @param {*} req
 * @param {*} resp
 * @param {*} next
 * @returns

*/
const verifyToken = async (req, resp, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return resp.status(401).json({
        message: 'Unauthorized',
      });
    }
    const { id } = jwtDecode(token.replace('Bearer ', ''));
    if (!id) {
      return resp.status(401).json({
        message: 'Unauthorized',
      });
    }

    //redis checking token
    const value = await redis.getValue(id);
    if (!value) {
      return resp.status(401).json({
        message: 'Unauthorized',
      });}
    if(token.replace('Bearer ', '')!=value){
      return resp.status(401).json({
        message: 'Unauthorized',
      });
    }
    // const temp = value.split('++');
    // if (temp[0] != token.replace('Bearer ', '')) {
    //   return resp.status(401).json({
    //     message: 'Unauthorized',
    //   });
    // }
    req.id = id;
    next();
  } catch (error) {
    return resp.status(401).json({
      message: 'Unauthorized',
    });
  }
};

module.exports = { verifyToken };
