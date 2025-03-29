import express from 'express';
import AppController from '../controllers/ProductController';
import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', (req, res) => {
  res.send('Server is active and ready to serve!');
});

// router.post('/:item/add', AppController.addItem);
// router.get('/:item/quantity', AppController.getItem);
// router.post('/:item/sell', AppController.sellItem);


router.use((req, res, next) => {
  const error = new AppError('Route not Found', 404);
  next(error);
});

export default router;