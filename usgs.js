/* global require */

// import modules
var http = require('http');

// get the most current gauge observation data
var getGaugeObservation = function (gaugeId, callback) {

  // create request options
  var options = {
    port: 80,
    protocol: 'http:',
    hostname: 'waterservices.usgs.gov',
    path: '/nwis/iv/nwis/iv/?format=json&sites=' + gaugeId + '&parameterCd=00060,00065',
    headers: {
      'User-Agent': 'Request'
    }
  };

  // make the request to the river gauge
  http.request(options, function (res) {

    // empty string to load the full response body into
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    res.on('data', function (chunk) {
      str += chunk;
    });

    // the whole response has been received, so process it
    res.on('end', function () {

      // parse the json response
      var resData = JSON.parse(str);

      // get the timeseries array out of the object
      var timeSeries = resData.value.timeSeries;

      // variable to store observation, starting with the datetime stamp of the observation
      var observation = {
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

      // process the callback with the observation
      callback(observation);

    }); // close end listener
  }); // close request
};

// expose the ability to get a gauge request
module.exports = getGaugeObservation;
