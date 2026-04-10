'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Todas estas rutas son solo para administradores
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router.route('/:id')
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.patch('/:id/toggle-status', userController.toggleUserStatus);
router.patch('/:id/password', userController.updateUserPassword);
router.get('/:id/orders', userController.getUserOrders);

module.exports = router;
