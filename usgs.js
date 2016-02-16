/* global require, module */

// import modules
var request = require('request');

// process the json response from the usgs
var processResponse = function(usgsJson, callback){

  // get the timeseries array out of the object
  var timeSeries = usgsJson.value.timeSeries;

  // variable to store observation, starting with the datetime stamp of the observation
  var gaugeResponse = {
    gaugeid: timeSeries[0].sourceInfo.siteCode[0].value,
    parameters: {
      cfs: [],
      ft: []
    }
  };

  // iterate the timeseries array
  for (var i = 0; i < timeSeries.length; i++) {

    // if it is a cfs reading
    if (timeSeries[i].variable.variableCode[0].value === '00060') {

      // iterate the series of values
      for (var c = 0; c < timeSeries[i].values[0].value.length; c++) {

        // create an object with the datetime and observation, and add it to the response
        gaugeResponse.parameters.cfs.push({
          datetime: new Date(Date.parse(timeSeries[i].values[0].value[c].dateTime)),
          value: parseInt(timeSeries[i].values[0].value[c].value)
        });

      }

      // otherwise, if it is a foot reading
    } else if (timeSeries[i].variable.variableCode[0].value === '00065') {

      // iterate the series of values
      for (var f = 0; f < timeSeries[i].values[0].value.length; f++) {

        // create an object with the datetime and observation, and add it to the response
        gaugeResponse.parameters.ft.push({
          datetime: new Date(Date.parse(timeSeries[i].values[0].value[f].dateTime)),
          value: parseFloat(timeSeries[i].values[0].value[f].value)
        });

      }
    }
  }

  // pass the gauge information into the callback
  callback(gaugeResponse);

};

// get gauge stage
var getGauge = function (gaugeId, gaugePeriod, callback) {

  // create request options
  var options = {
    port: 80,
    uri: 'http://waterservices.usgs.gov/nwis/iv/nwis/iv/',
    qs: {
      format: 'json',
      sites: gaugeId.toString(),
      parameterCd: '00060,00065'
    },
    headers: {
      'User-Agent': 'Request'
    },
    json: true
  };

  // if a gauge period is specified, add the query parameter
  if (gaugePeriod.length || gaugePeriod) {
    options.qs.period = gaugePeriod
  }

  // make the request
  request(options, function (err, res, body) {

    // process the response and pass the callback along
    processResponse(body, callback);
  });
};

// get current gauge stage
var getCurrentGauge = function(gaugeId, callback){

  // call get gauge with blank gauge period, getting the default response of the most current observation
  getGauge(gaugeId, '', callback);
};

// get last six hours
var get06HourGauge = function(gaugeId, callback) {

  // call to get gauge readings for last six hours
  getGauge(gaugeId, 'PT6H', callback);
};

// get last 12 hours
var get12HourGauge = function(gaugeId, callback) {

  // call to get gauge readings for last twelve hours
  getGauge(gaugeId, 'PT12H', callback);
};

// make the right methods available
module.exports = {
  getCurrentGauge: getCurrentGauge,
  get06HourGauge: get06HourGauge,
  get12HourGauge: get12HourGauge
};