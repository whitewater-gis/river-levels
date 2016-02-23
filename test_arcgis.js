/* global require */

// import modules
var arcgis = require('./arcgis');

// update the hydrolines
arcgis.pushHydrolineLevels();

// update the hydropoints
arcgis.pushPointLevels();