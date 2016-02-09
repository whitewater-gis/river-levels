/* global require */

// import modules
var usgs = require('./usgs');

// variables for testing
var gaugeId = 12134500;
var reachId = 2209;

// test gauge
usgs.getCurrentGauge(gaugeId, function (result) {
  console.log(result);
});