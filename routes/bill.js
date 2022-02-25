const express = require('express');
const expensesController = require('../controllers/bill');
const isAuth = require('../middleware/isAuth');

const router = express.Router();





// router.get('/bills', isAuth, expensesController.bills)
router.get('/api/bills', isAuth, expensesController.getBills)
router.get('/api/bills/:id', isAuth, expensesController.getBill)
router.post('/api/bills', isAuth, expensesController.createBill)
router.delete('/api/bills/:id', isAuth, expensesController.deleteBill)
router.put('/api/bills/:id/paid', isAuth, expensesController.paidStatus)

// router.put('/approve/:id', isAuth, expensesController.approveExpenses)
router.get('/api/categories', isAuth, expensesController.categories)
router.post('/api/categories', isAuth, expensesController.createCategory)
router.delete('/api/categories/:id', isAuth, expensesController.deleteCategory)

module.exports = router;
