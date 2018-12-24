const http_error = require('http-errors');
const fs = require('fs');
// const bcrypt = require('bcrypt');
const path = require('path');
const config = require('../config/config');
const profile_path = path.join(__dirname, config.profile_upload_path);

const { AuthRepository } = require('./../Repository/authRepository');
const { generateToken } = require('./../utils/util');
const UserModel = require('./../models/user');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userResult = await getUserById({ email, password });
    const token = await generateToken({
      _id: userResult._id,
      name: userResult.name,
      email: userResult.email
      // password: userResult.password
    });
    res.status(200).json({ token, _id: userResult._id, user_name: userResult.name });
  } catch (error) {
    res.status(400 || error.status).json({ error: error.message });
  }
};

exports.register = async (req, res, next) => {
  let file = req.file;
  try {
    const { name, email, password } = req.body;
    const user = {
      name,
      email,
      password,
      photo: file ? file.originalname : null
    };
    const userResult = await createUser(user);
    const token = await generateToken(user);
    res
      .json({ token, id: userResult._id, name: userResult.name, email: userResult.email })
      .status(201);
  } catch (error) {
    if (fs.existsSync(profile_path + file.filename)) {
      fs.unlinkSync(profile_path + file.filename);
    }
    res.status(400 || error.status).json({ error: error.message });
  }
};

// exports.forgotPassword = async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     if (!/\S/.test(email) || typeof email === 'undefined' || typeof email !== 'string') {
//       throw new http_error(400, `Email is not valid!`);
//     }
//     const user = await UserModel.findOne({ email: email }).exec();
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

exports.getUserImage = async (req, res, next) => {
  try {
    // Get one image by its ID
    const { id } = req.params;
    let user = await UserModel.findOne({ _id: id }).exec();
    const extension = user.photo.split('.').pop();

    // const image = `${req.protocol}://${req.host}/images/${userId}`;

    // stream the image back by loading the file
    res.setHeader('Content-Type', `image/${extension}`);
    fs.createReadStream(path.join(profile_path, user.photo)).pipe(res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

async function getUserById(user) {
  try {
    const authRepo = new AuthRepository();
    return await authRepo.getUser(user);
  } catch (error) {
    throw error;
  }
}

// async function getUsers() {
//   try {
//     return await UserModel.find({}).exec();
//   } catch (error) {
//     throw error;
//   }
// }

async function createUser(user) {
  try {
    return await UserModel.create(user);
  } catch (error) {
    throw error;
  }
}
