/* global require */

// import modules
var request = require('request');

// process the json response from the usgs
var processResponse = function(usgsJson, callback){

  // get the timeseries array out of the object
  var timeSeries = usgsJson.value.timeSeries;

  // variable to store observation, starting with the datetime stamp of the observation
  var observation = {
    gaugeId: timeSeries[0].sourceInfo.siteCode[0].value,
    dateTime: new Date(Date.parse(timeSeries[0].values[0].value[0].dateTime))
  };

  // iterate the timeseries array
  for (var i = 0; i < timeSeries.length; i++) {

    // if it is a cfs reading
    if (timeSeries[i].variable.variableCode[0].value === '00060') {

      // record the observation as the cfs property of the object
      observation.cfs = parseInt(timeSeries[i].values[0].value[0].value);

      // otherwise, if it is a foot reading
    } else if (timeSeries[i].variable.variableCode[0].value === '00065') {

      // record the observation as the ft property of the object
      observation.ft = parseFloat(timeSeries[i].values[0].value[0].value);
    }
  }

  // pass the gague information into the callback
  callback(observation);

};

// get current gauge stage
var getCurrentGauge = function (gaugeId, callback) {

  // create request options
  var options = {
    port: 80,
    uri: 'http://waterservices.usgs.gov/nwis/iv/nwis/iv/',
    qs: {
      format: 'json',
      sites: gaugeId,
      parameterCd: '00060,00065'
    },
    headers: {
      'User-Agent': 'Request'
    },
    json: true
  };

  // make the request
  request(options, function (err, res, body) {

    // process the response and pass the callback along
    processResponse(body, callback);
  });
};

// make the get gauge available
exports.getCurrentGauge = getCurrentGauge;