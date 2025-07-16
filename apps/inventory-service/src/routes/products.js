const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const productController = require('../controllers/products');
const router = express.Router();


router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', authenticateToken, isAdmin,  productController.create);
router.put('/:id', authenticateToken, isAdmin,  productController.update);
router.delete('/:id', authenticateToken, isAdmin,  productController.remove);
router.patch('/:id/stock', productController.updateStock);

module.exports = router;
