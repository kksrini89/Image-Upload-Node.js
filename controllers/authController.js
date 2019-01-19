const fs = require('fs');
const path = require('path');
const http_error = require('http-errors');
const jimp = require('jimp');
const crypto = require('crypto');
// const bcrypt = require('bcrypt');
const config = require('../config/config');
const mail = require('../handlers/mail');
const profile_path = path.join(__dirname, config.profile_upload_path);
const dealer_path = path.join(__dirname, config.dealer_upload_path);

const { AuthRepository } = require('./../Repository/authRepository');
const { generateToken } = require('./../utils/util');
const UserModel = require('./../models/user');
const ImageModel = require('./../models/car-image');
let ObjectId = require('mongoose').Types.ObjectId;

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userResult = await getUserById({ email, password });
    const token = await generateToken({
      _id: userResult._id,
      name: userResult.name,
      email: userResult.email,
      roles: userResult.roles,
      dealer_info: userResult.dealer_info
    });
    res.status(200).json({ token, _id: userResult._id, user_name: userResult.name });
  } catch (error) {
    res.status(400 || error.status).json({ error: error.message });
  }
};

exports.register = async (req, res, next) => {
  let files = req.body.photos;
  try {
    const {
      name,
      email,
      password,
      dealer_name,
      showroomName,
      address,
      city,
      state,
      contact_no
    } = req.body;
    const user_id = new ObjectId();
    let dealer_image_id = null;
    let profile_image_id = null;
    if (files !== null && files !== undefined) {
      const imagePromises = await Array.from(files).map(async file => {
        if (file) {
          return await ImageModel.create({
            fileName: file.filename,
            image_type: file.fieldname, //'profile_image',
            car: null,
            user: user_id
          });
        }
      });
      const images = await Promise.all(imagePromises);
      images.map(item => {
        if (item.image_type === 'dealer_image') {
          dealer_image_id = item.id;
        } else {
          profile_image_id = item.id;
        }
        return item;
      });
    }
    const user = {
      _id: user_id,
      name,
      email,
      password,
      dealer_info: {
        name: dealer_name,
        showroomName,
        address,
        city,
        state,
        contact_no,
        image: dealer_image_id
      },
      photo: profile_image_id //file ? file : null
    };
    let userResult = await createUser(user);
    if (userResult && userResult.dealer_info && userResult.dealer_info.image) {
      userResult.dealer_info.image = `${req.protocol}://${req.host}/images/${userResult.dealer_info.image}/dealer_image`;
    }
    const token = await generateToken({
      _id: userResult._id,
      name: userResult.name,
      email: userResult.email,
      roles: userResult.roles,
      photo: `${req.protocol}://${req.host}/images/${userResult.photo}/profile_image`,
      dealer_info: userResult.dealer_info
    });
    res
      .json({
        token,
        id: userResult._id,
        name: userResult.name,
        email: userResult.email,
        dealer_info: userResult.dealer_info
      })
      .status(201);
  } catch (error) {
    // if (fs.existsSync(profile_path + file.filename)) {
    //   fs.unlinkSync(profile_path + file.filename);
    // }
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
  res.status(200).json({ success: 'Email is sent successfully!' });
};

/*exports.reset = async (req, res, next) => {
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
}; */

exports.getImage = async (req, res, next) => {
  try {
    // Get one image by its ID
    const { id, type } = req.params;
    if (!ObjectId.isValid(id)) {
      throw new httpError(400, `Object Id is not valid!`);
    }
    // let user = await UserModel.findOne({ _id: id }).exec();
    let user = await ImageModel.findOne({ _id: id, image_type: type }).exec();
    if (user == null || user === undefined) {
      res.status(200).json(null);
    } else {
      const extension = `${user.fileName.split('.').pop()}`;

      // const image = `${req.protocol}://${req.host}/images/${userId}`;

      let readStream = fs.createReadStream(
        path.resolve(__dirname, config.profile_upload_path, user.fileName)
      );

      // When the stream is done being read, end the response
      readStream.on('close', () => {
        res.end();
      });
      // stream the image back by loading the file
      res.setHeader('Content-Type', `image/${extension}`);
      readStream.pipe(res);
    }
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

exports.resize = async (req, res, next) => {
  console.log(req.files);
  // check if there is no new file to resize
  if (Object.keys(req.files).length === 0) {
    next(); // skip to the next middleware
    return;
  }
  const { dealer_image, profile_image } = req.files;
  const [dealer_file] = dealer_image;
  const [profile_file] = profile_image;
  // now we resize
  const resizePromises = Array.from([dealer_file, profile_file]).map(async file => {
    if (file) {
      // const extension = file.mimetype.split('/')[1];
      // const modifiedFile = `${uuid.v4()}.${extension}`;
      const photo = await jimp.read(file.path);
      await photo.resize(config.profile_width, jimp.AUTO);
      await photo.write(`${profile_path}/${file.filename}`);
      return { fieldname: file.fieldname, filename: file.filename };
    }
  });

  req.body.photos = await Promise.all(resizePromises);

  // once we have written the photo to our filesystem, keep going!
  next();
};
