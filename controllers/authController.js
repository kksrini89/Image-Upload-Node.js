const fs = require('fs');
const path = require('path');
const http_error = require('http-errors');
const crypto = require('crypto');
// const bcrypt = require('bcrypt');
const config = require('../config/config');
const mail = require('../handlers/mail');
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

exports.forgotPassword = async (req, res, next) => {
  // 1. See if a user with that email exists
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    throw new http_error(400, `No account with that email exists!`);
  }
  const decipher = crypto.createDecipher(
    config.development.algorithm,
    config.development.secretKey
  );
  user.password = decipher.update(user.password, 'hex', 'utf8') + decipher.final('utf8');
  // 2. Set reset tokens and expiry on their account
  //  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  //  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  //  await user.save();
  // 3. Send them an email with the token
  //  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    filename: 'forgot-password',
    subject: 'Forgot Password',
    username: user.name,
    password: user.password
  });
  res.status(200).json({ success: "Email is sent successfully!"});
};

exports.reset = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    throw new http_error(400, 'Password reset is invalid or has expired');
  }
};

exports.confirmedPasswords = async (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next(); // keepit going!
    return;
  }
};

exports.update = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
};

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
