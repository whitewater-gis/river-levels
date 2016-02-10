/* global require */
'use strict';

// import module and function
var getCurrentGauge = require('./usgs').getCurrentGauge;

// expose capability and hand in the event (input data) and context object for AWS Lambda
exports.handler = function(event, context){

  // call the method with the input event, get the result and process using the callback
  getCurrentGauge(event, function(observation){

    // return the gauge observation
    context.succeed(observation);
  });
};
