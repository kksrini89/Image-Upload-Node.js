const express = require('express');
const router = express.Router();

const { verifyToken } = require('./../utils/util');
const { catchErrors } = require('./../handlers/errorHandlers');
const carController = require('./../controllers/carController');

router.get('/', verifyToken, catchErrors(carController.getCars));
router.get('/:id', verifyToken, catchErrors(carController.getCarById));
router.post(
  '/',
  verifyToken,
  carController.upload,
  carController.resize,
  catchErrors(carController.addCar)
);
router.put('/:id', verifyToken, catchErrors(carController.updateCarById));
router.delete('/:id', verifyToken, catchErrors(carController.deleteCarById));

router.get('/images/all', verifyToken, catchErrors(carController.getImages));
router.get('/images/:image_id', catchErrors(carController.getImageById));

module.exports = router;
