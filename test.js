/* global require */

// import modules
var usgs = require('./usgs');

// variables for testing
var gaugeId = 12134500;
//var reachId = 2209;
//var gaugeId = '01646500'; // Potomac with lots of data

// test get current reading from gauge
usgs.getCurrentGauge(gaugeId, function (result) {
  console.log(JSON.stringify(result));
});

// test get last six hours of readings from gauge
usgs.get06HourGauge(gaugeId, function (result){
  console.log(JSON.stringify(result));
});

// test get last 12 hours of readings from gauge
usgs.get12HourGauge(gaugeId, function (result){
  console.log(JSON.stringify(result));
});