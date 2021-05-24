const path = require('path');

const express = require('express');

const cardController = require('../controllers/card');
const isAuth = require('../middleware/isAuth');


const router = express.Router();

router.get('/', isAuth, cardController.getCards)
router.post('/create', isAuth, cardController.createCard)
router.get('/:id', isAuth, cardController.getCard)
router.put('/deposit/:id', isAuth, cardController.deposit)
router.put('/withdraw/:id', isAuth, cardController.withdraw)
// router.delete('/delete', isAuth, cardController.deleteProcesses)
// router.put('/', isAuth, cardController.editProcesses)


module.exports = router;
