import { ProductController } from '../controllers/ProductController';
import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../config/upload';
import { productValidationRules } from '../middleware/validator';

const router = Router();

router.get('/', (req, res) => {
  res.send('Server is active and ready to serve!');
});

// Apply validation middleware to all routes
router.post('/products',
  upload.array('images', 10),
  productValidationRules.create,
  ProductController.createProduct
);

router.get('/products',
  productValidationRules.getAll,
  ProductController.getAllProducts
);

router.get('/products/:id',
  productValidationRules.getById,
  ProductController.getProductById
);

router.put('/products/:id',
  upload.array('images', 10),
  productValidationRules.update,
  ProductController.updateProduct
);

router.delete('/products/:id',
  productValidationRules.delete,
  ProductController.deleteProduct
);

// router.post('/:item/sell', ProductController.sellItem);

router.use((req, res, next) => {
  const error = new AppError('Route not Found', 404);
  next(error);
});

export default router;