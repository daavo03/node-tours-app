const express = require('express');
const viewsController = require('../controllers/viewsController');

const router = express.Router();

// Creating route to access the template
router.get('/', viewsController.getOverview);
router.get('/tour', viewsController.getTour);

module.exports = router;
