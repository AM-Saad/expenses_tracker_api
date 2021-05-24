const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();

router.post("/login", authController.login);
router.post('/signup', authController.singup)

// router.get('/signWithGoogle', authController.getSignWithGoogle);
// router.get('/auth/google/callback', authController.getCallBack);

// router.get('/checkout', isAuth, authController.getCheckout);
// router.get('/checkout/success', authController.getCheckoutSuccess);
// router.get('/checkout/cancel', authController.getCheckout);

module.exports = router;
