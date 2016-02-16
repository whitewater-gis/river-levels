/* global require */

// import modules
var arcgis = require('./arcgis');
var request = require('request');

// create a request object with some defaults for the reach points
var reachPointRequest = request.defaults({
  baseUrl: 'http://services5.arcgis.com/12oODIpfxlRR11MF/ArcGIS/rest/services/reach_map/FeatureServer/4/',
  json: true
});

// test get lookup hash
arcgis.pushLevels(reachPointRequest, function(res){
  console.log(res);
});