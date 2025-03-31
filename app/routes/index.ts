import { ProductController } from '../controllers/ProductController';
import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../config/upload';

const router = Router();

router.get('/', (req, res) => {
  res.send('Server is active and ready to serve!');
});

router.post('/products', upload.array('images', 10), ProductController.createProduct);
router.get('/products', ProductController.getAllProducts);
router.get('/products/:id', ProductController.getProductById);
// router.post('/:item/sell', ProductController.sellItem);


router.use((req, res, next) => {
  const error = new AppError('Route not Found', 404);
  next(error);
});

export default router;