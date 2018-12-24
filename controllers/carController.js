const multer = require('multer');
const jimp = require('jimp');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const path = require('path');
const httpError = require('http-errors');

// Models
const CarModel = require('../models/car');
const UserModel = require('../models/user');
const config = require('./../config/config');
const car_upload_path = path.resolve(__dirname, config.car_upload_path);

const storage = {
  destination: function(req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: function(req, file, cb) {
    console.log(file);
    const fileName = `${file.fieldname}-${uuid.v4()}`;
    cb(null, fileName);
    // cb(null, file.fieldname + '-' + Date.now());
  }
};

const multerOptions = {
  storage: multer.diskStorage({ storage: storage }),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  }
};

exports.upload = multer(multerOptions).array('photos');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.files) {
    next(); // skip to the next middleware
    return;
  }

  const resizePromises = Array.from(req.files).map(async file => {
    if (file) {
      const extension = file.mimetype.split('/')[1];
      const modifiedFile = `${uuid.v4()}.${extension}`;
      const photo = await jimp.read(file.path);
      await photo.resize(config.car_resize_width, jimp.AUTO);
      await photo.write(`${car_upload_path}/${modifiedFile}`);
      return modifiedFile;
    }
  });

  req.body.photos = await Promise.all(resizePromises);
  // const photos = req.body.photos;

  /*const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);*/

  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.addCar = async (req, res, next) => {
  let createdBy = {};
  let updatedBy = {};
  if (req.token) {
    createdBy = jwt.decode(req.token).user;
    updatedBy = jwt.decode(req.token).user;
  }

  const {
    make,
    make_year,
    model,
    transmission_type,
    varriant,
    kms_driven,
    number_of_owners,
    fuel_type,
    condition,
    color,
    vehicle_type,
    inspection_valid_until,
    registrationPlace,
    insurance_type,
    insurance_year,
    amount,
    isFixed,
    isExchangeAccepted,
    warranty,
    duration,
    mileage,
    description,
    isCarAccidental,
    isCarCertified,
    isCarFloodAffected
  } = req.body;
  const stocker = {
    make,
    make_year,
    model,
    transmission_type,
    varriant,
    kms_driven,
    number_of_owners,
    fuel_type,
    condition,
    color,
    vehicle_type,
    inspection_valid_until
  };

  const regulatoryInfo = {
    registrationPlace,
    insurance_type,
    insurance_year
  };

  const priceWarranty = {
    amount,
    isFixed,
    isExchangeAccepted,
    warranty
  };
  const newCar = {
    stocker,
    regulatoryInfo,
    priceWarranty,
    photos: req.body.photos ? req.body.photos : null,
    duration,
    mileage,
    description,
    isCarAccidental,
    isCarCertified,
    isCarFloodAffected,
    createdBy,
    updatedBy
  };
  // req.body.createdBy = req.user._id;
  const createdCar = await CarModel.create(newCar);
  res.json({ result: createdCar }).status(201);
};

exports.getCars = async (req, res, next) => {
  const cars = await CarModel.find({}).exec();
  if (cars && cars.length === 0) {
    throw new httpError(400, `No cars does exists!`);
  }
  res.json({ result: cars }).status(200);
};

exports.getCarById = async (req, res, next) => {
  const { id } = req.params;
  if (!/\S/.test(id)) {
    throw new httpError(400, `input parameter id is required!`);
  }
  const car = await CarModel.findOne({ _id: id }).exec();
  if (car === null && car === undefined) {
    throw new httpError(400, `Car does not exists for _id - ${id}`);
  }
  res.json({ result: car }).status(200);
};

exports.updateCarById = async (req, res, next) => {
  const { id } = req.params;
  const updatedItem = req.body;
  if (!/\S/.test(id)) {
    throw new httpError(400, `input parameter id is required!`);
  }
  if (
    typeof updatedItem === 'string' ||
    typeof updatedItem === 'undefined' ||
    (typeof updatedItem === 'object' && Object.keys(updatedItem).length === 0)
  ) {
    throw new httpError(400, `Please pass the object to be updated!`);
  }
  const existingCarItem = await CarModel.findOne({ _id: id }).exec();
  if (existingCarItem !== null && existingCarItem !== undefined) {
    throw new httpError(400, `Car does not exists for _id - ${id}`);
  }
  if (req.token) {
    updatedItem.updatedBy = jwt.decode(req.token);
  }
  const car = await CarModel.findByIdAndUpdate(
    { _id: id },
    {
      $set: updatedItem
    },
    { new: true, runValidators: true }
  ).exec();

  res.json({ result: car }).status(202);
};

exports.deleteCarById = async (req, res, next) => {
  const { id } = req.params;
  if (!/\S/.test(id)) {
    throw new httpError(400, `input parameter id is required!`);
  }

  const existingCarItem = await CarModel.findOne({ _id: id }).exec();
  if (existingCarItem !== null && existingCarItem !== undefined) {
    throw new httpError(400, `Car does not exists for _id - ${id}`);
  }
  let updatedItem = {
    isDeleted: true
  };
  if (req.token) {
    updatedItem.updatedBy = jwt.decode(req.token);
  }
  await CarModel.findByIdAndUpdate(
    { _id: id },
    { $set: updatedItem },
    { new: true, runValidators: true }
  ).exec();

  res.json({ success: 'Car is deleted!' }).status(204);
};
