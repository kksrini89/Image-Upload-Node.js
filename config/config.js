module.exports = {
  development: {
    saltingRounds: 10,
    algorithm: 'aes256',
    secretKey: 'CarDealerBusiness'
  },
  profile_upload_path: './../public/uploads/user_profiles',
  dealer_upload_path: './../public/uploads/dealer_images',
  car_upload_path: './../public/uploads/cars',
  profile_width: 600,
  car_resize_width: 400,
  car_resize_height: 400
};
