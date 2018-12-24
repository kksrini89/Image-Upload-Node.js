const jwt = require('jsonwebtoken');
const jimp = require('jimp');

const config = require('../config/config');

module.exports = {
  // FORMAT OF TOKEN
  // Authorization: Bearer <access_token>
  generateToken: user => {
    try {
      return new Promise((res, reject) => {
        jwt.sign({ user }, 'secretkey', { expiresIn: '24h' }, (err, token) => {
          if (err) {
            reject(err);
          }
          res(token);
        });
      });
    } catch (error) {
      throw error;
    }
  },
  // Verify Token
  verifyToken: function(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
      // Split at the space
      const bearer = bearerHeader.split(' ');
      // Get token from array
      const bearerToken = bearer[1];
      // Set the token
      req.token = bearerToken;
      // Next middleware
      next();
    } else {
      // Forbidden
      res.sendStatus(403);
    }
  },
  resize: async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
      next(); // skip to the next middleware
      return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(config.profile_upload_path);
    // once we have written the photo to our filesystem, keep going!
    next();
  }
};
