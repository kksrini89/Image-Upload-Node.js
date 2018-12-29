const http_error = require('http-errors');
// const bcrypt = require('bcrypt');
const crypto = require('crypto');
const stage = require('../config/config')[process.env.NODE_ENV];

const UserModel = require('../models/user');

class AuthRepository {
  constructor() {}

  async getUsers() {
    try {
      return await UserModel.find({}).exec();
    } catch (error) {
      throw error;
    }
  }

  async getUser(user) {
    try {
      const userItem = await UserModel.findOne({
        email: user.email
      }).exec();

      if (!userItem) {
        throw new http_error(404, `User does not exists!`);
      }
      const decipher = crypto.createDecipher(stage.algorithm, stage.secretKey);
      userItem.password =
        decipher.update(userItem.password, 'hex', 'utf8') + decipher.final('utf8');
      if (userItem.password.toString().toLowerCase() !== user.password.toString().toLowerCase()) {
        throw new http_error(404, `Authentication Error - Password does not match!`);
      }
      return userItem;
      // return bcrypt
      //   .compare(user.password, userItem.password)
      //   .then(match => {
      //     if (!match) {
      //       throw new http_error(404, `Authentication Error - Password does not match!`);
      //     }
      //     return userItem;
      //   })
      //   .catch(err => {
      //     throw new http_error(400, `Error in Authentication - ${err.message}`);
      //   });
    } catch (error) {
      throw error;
    }
  }

  async createUser(user) {
    try {
      return await UserModel.create(user);
    } catch (error) {
      throw error;
    }
  }
}

module.exports.AuthRepository = AuthRepository;
