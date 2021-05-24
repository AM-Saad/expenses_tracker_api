const express = require('express');
const expensesController = require('../controllers/bill');
const isAuth = require('../middleware/isAuth');

const router = express.Router();





// router.get('/bills', isAuth, expensesController.bills)
router.get('/api/bills', isAuth, expensesController.getAllbills)
router.post('/api/bills', isAuth, expensesController.createBill)
router.delete('/api/bills/:id', isAuth, expensesController.deleteBill)
router.put('/api/bills/:id/paid', isAuth, expensesController.paidStatus)

// router.put('/approve/:id', isAuth, expensesController.approveExpenses)
router.get('/api/bills/types/all', isAuth, expensesController.customTypes)
router.post('/api/bills/types', isAuth, expensesController.createCustomType)

module.exports = router;
