'use strict';
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Solo administradores pueden gestionar tareas manuales por ahora
router.use(restrictTo('admin'));

router
  .route('/')
  .get(taskController.getAllTasks)
  .post(taskController.createTask);

router.get('/history', taskController.getVehicleHistory);

router
  .route('/:id')
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
