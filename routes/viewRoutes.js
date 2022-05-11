const express = require('express');
const viewsController = require('../controllers/viewsController');

const router = express.Router();

// Creating route to access the template
router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);

module.exports = router;
