const fs = require('fs');
const multer = require('multer');
const jimp = require('jimp');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const path = require('path');
const httpError = require('http-errors');

// Models
const CarModel = require('../models/car');
const UserModel = require('../models/user');
const ImageModel = require('../models/car-image');
const config = require('./../config/config');
const car_upload_path = path.resolve(__dirname, config.car_upload_path);
let ObjectId = require('mongoose').Types.ObjectId;

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, car_upload_path);
  },
  filename: function(req, file, cb) {
    console.log(file);
    const extension = `${file.mimetype.split('/').pop()}`;
    const fileName = `${new Date().getTime()}.${extension}`;
    cb(null, fileName);
    // cb(null, file.fieldname + '-' + Date.now());
  }
});

const multerOptions = {
  storage: storage,
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
      // const extension = file.mimetype.split('/')[1];
      // const modifiedFile = `${uuid.v4()}.${extension}`;
      const photo = await jimp.read(file.path);
      await photo.resize(config.car_resize_width, config.car_resize_height).quality(100); //jimp.AUTO);
      await photo.write(`${car_upload_path}/${file.filename}`);
      return file.filename;
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
  const photos = req.body.photos;
  let images = [];
  const car_id = new ObjectId();
  if (photos && photos.length > 0) {
    const imagePromises = Array.from(photos).map(async item => {
      const imageItem = {
        fileName: item,
        car: car_id,
        user: createdBy._id
      };
      return await ImageModel.create(imageItem);
    });
    images = await Promise.all(imagePromises);
  }
  const newCar = {
    _id: car_id,
    stocker,
    regulatoryInfo,
    priceWarranty,
    photos: images && images.length > 0 ? images : null, //req.body.photos ? req.body.photos : null,
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

exports.beforeUpdate = async (req, res, next) => {
  let { new_image_count } = req.params;
  new_image_count = +new_image_count;
  if (new_image_count <= 4) {
    const imageUpload = multer(multerOptions).fields([
      { name: 'new_images', maxCount: +new_image_count }
    ]);
    console.log(imageUpload);
    imageUpload(req, res, async function(err) {
      if (req.files.new_images == undefined) {
        return next();
      }
      if (err) {
        next('Not able to upload images!');
      } else {
        const resizePromises = Array.from(req.files.new_images).map(async file => {
          if (file) {
            // const extension = file.mimetype.split('/')[1];
            // const modifiedFile = `${uuid.v4()}.${extension}`;
            const photo = await jimp.read(file.path);
            await photo
              .resize(config.car_resize_width, config.car_resize_height)
              .quality(100)
              .scaleToFit(400, 400); //jimp.AUTO);
            await photo.write(`${car_upload_path}/${file.filename}`);
            return file.filename;
          }
        });
        req.body.photos = await Promise.all(resizePromises);
        console.log(req);
        return next();
      }
    });
  } else {
    throw new httpError(400, `New image upload count exceeded!`);
  }
};

// UPDATE Car By Id
exports.updateCarById = async (req, res, next) => {
  console.log(req);
  const { id } = req.params;
  let updatedItem = req.body;
  if (!/\S/.test(id)) {
    throw new httpError(400, `input parameter id is required!`);
  }
  const existingCarItem = await CarModel.findOne({ _id: id }).exec();
  if (existingCarItem == null || existingCarItem == undefined) {
    throw new httpError(400, `Car does not exists for _id - ${id}`);
  }
  if (
    typeof updatedItem === 'string' ||
    typeof updatedItem === 'undefined' ||
    (typeof updatedItem === 'object' && Object.keys(updatedItem).length === 0)
  ) {
    throw new httpError(400, `Please pass the object to be updated!`);
  }

  let new_images = [];
  let saved_images = [];
  let images = [];
  if (
    updatedItem.photos !== null &&
    updatedItem.photos !== undefined &&
    updatedItem.photos.length > 0
  ) {
    const photos = updatedItem.photos;
    if (photos && photos.length > 0) {
      const imagePromises = Array.from(photos).map(async item => {
        const imageItem = {
          fileName: item,
          car: existingCarItem._id,
          user: existingCarItem.createdBy._id
        };
        return await ImageModel.create(imageItem);
      });
      new_images = await Promise.all(imagePromises);
      new_images = new_images && new_images.length > 0 ? new_images.map(item => item.id) : [];
    }
  }
  if (updatedItem.saved_images != undefined && updatedItem.saved_images.length > 0) {
    saved_images = updatedItem.saved_images;
  }

  images = [...new_images, ...saved_images];

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

  const updatedCar = {
    stocker,
    regulatoryInfo,
    priceWarranty,
    photos: images.length > 0 ? images : null,
    duration,
    mileage,
    description,
    isCarAccidental,
    isCarCertified,
    isCarFloodAffected
  };

  if (req.token) {
    updatedCar.updatedBy = jwt.decode(req.token).user;
  }
  const car = await CarModel.findOneAndUpdate(
    { _id: id },
    {
      $set: updatedCar
    },
    { new: true, runValidators: true }
  ).exec();

  await Promise.all(
    Array.from(existingCarItem.photos).map(async item => {
      if (!images.includes(item.toString())) {
        const imageItem = await ImageModel.findOne({ _id: item }).exec();
        await ImageModel.findOneAndRemove({ _id: ObjectId(item) }).exec();
        if (imageItem !== null) {
          await fs.unlink(path.resolve(car_upload_path, imageItem.fileName));
        }
      }
    })
  );

  res.json({ result: car }).status(202);
};

exports.updateCarWithoutImage = async (req, res, next) => {
  const { id } = req.params;
  if (!/\S/.test(id)) {
    throw new httpError(400, `input parameter id is required!`);
  }
  const existingCarItem = await CarModel.findOne({ _id: id }).exec();
  if (existingCarItem == null || existingCarItem == undefined) {
    throw new httpError(400, `Car does not exists for _id - ${id}`);
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

  const updatedCar = {
    stocker,
    regulatoryInfo,
    priceWarranty,
    duration,
    mileage,
    description,
    isCarAccidental,
    isCarCertified,
    isCarFloodAffected
  };

  if (req.token) {
    updatedCar.updatedBy = jwt.decode(req.token).user;
  }
  const car = await CarModel.findOneAndUpdate(
    { _id: id },
    {
      $set: updatedCar
    },
    { new: true, runValidators: true }
  ).exec();

  res.json({ result: car }).status(202);
};

// DELETE Car By Id
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
    isDeleted: true,
    photos: null
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

// GET Image By Id
exports.getImageById = async (req, res, next) => {
  try {
    const { image_id } = req.params;
    if (!ObjectId.isValid(image_id)) {
      throw new httpError(400, `Image Object Id is not valid!`);
    }
    const image = await ImageModel.findOne({ _id: image_id, image_type: 'car_image' }).exec();
    // res.json({ result: image }).status(200);
    if (image == null || image == undefined) {
      res.status(200).json(null);
    } else {
      const extension = `${image.fileName.split('.').pop()}`;

      let readStream = fs.createReadStream(
        path.resolve(__dirname, config.car_upload_path, image.fileName)
      );

      // When the stream is done being read, end the response
      readStream.on('close', () => {
        res.end();
      });

      // Stream chunks to response
      res.setHeader('Content-Type', `image/${extension}`);
      readStream.pipe(res);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
  // fs.createReadStream(path.join(config.car_upload_path, image.fileName));//.pipe(res);
};

exports.getImages = async (req, res, next) => {
  const images = await ImageModel.find({}).exec();
  res.json({ result: images }).status(200);
};
