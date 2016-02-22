/* global require */

// import modules
const arcgis = require('./arcgis');

// single update point of reference
exports.handler = function(event, context){

  // update the hydroline levels
  arcgis.pushHydrolineLevels();

  // update the hydropoint levels
  arcgis.pushPointLevels();

};