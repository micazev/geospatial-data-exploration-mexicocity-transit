const express = require('express');
const router = express.Router();

// Import controllers
const mapController = require('../controllers/mapController');
const routeController = require('../controllers/routeController');
const stopController = require('../controllers/stopController');
const statsController = require('../controllers/statsController');
const heatmapController = require('../controllers/heatmapController');
const temporalController = require('../controllers/temporalController');

// Map endpoints
router.get('/maps/overview', mapController.getOverview);

// Route endpoints
router.get('/routes', routeController.getAllRoutes);
router.get('/routes/:id', routeController.getRouteById);

// Stop endpoints
router.get('/stops', stopController.getAllStops);
router.get('/stops/:id', stopController.getStopById);

// Statistics endpoints
router.get('/statistics', statsController.getSystemStats);

// Heatmap endpoints
router.get('/heatmap/:type', heatmapController.getHeatmap);

// Temporal endpoints
router.get('/temporal/:mode/:hour', temporalController.getTemporalData);

module.exports = router;
