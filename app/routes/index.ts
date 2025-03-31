import { ProductController } from '../controllers/ProductController';
import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', (req, res) => {
  res.send('Server is active and ready to serve!');
});

router.post('/product', ProductController.createProduct);
router.get('/products', ProductController.getAllProducts);
// router.get('/:item/quantity', ProductController.getItem);
// router.post('/:item/sell', ProductController.sellItem);


router.use((req, res, next) => {
  const error = new AppError('Route not Found', 404);
  next(error);
});

export default router;