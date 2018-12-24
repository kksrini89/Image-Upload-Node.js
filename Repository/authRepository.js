const http_error = require('http-errors');
const bcrypt = require('bcrypt');

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
      return bcrypt
        .compare(user.password, userItem.password)
        .then(match => {
          if (!match) {
            throw new http_error(404, `Authentication Error - Password does not match!`);
          }
          return userItem;
        })
        .catch(err => {
          throw new http_error(400, `Error in Authentication - ${err.message}`);
        });
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
