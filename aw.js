/* global require, module */
'use strict';

// import modules
var request = require('request');

// list of state abbreviations
var stateList = ['AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA',
  'WA', 'WV', 'WI', 'WY'];

// iterate the states and create a master levels list
var getReachLevels = function (callback) {

  // list to store reach observations
  var reachLevels = {};

  // track completed requests
  var completed_requests = 0;

  // iterate the list of states
  stateList.forEach(function(state){

    // create request options
    var options = {
      uri: 'http://www.americanwhitewater.org/content/River/state-summary/state/' + state + '/.json',
      port: 80,
      json: true
    };

    // make request
    request(options, function (err, res, body) {

      // the response does not send headers, or at least status headers - hence have to check the body to ensure array
      if (!err && body.constructor === Array) {

        // for every reach in the response
        body.forEach( function(reach) {

          // if there is a gauge
          if (reach.gauge_id != null) {

            // dictionary to clean up condition descriptions
            var condition = {
              low: 'low',
              med: 'medium',
              high: 'high'
            };

            // add the reach to the levels list
            reachLevels[reach.id.toString()] = {
              reachid: reach.id,
              stage: reach.reading_formatted.trim(),
              condition: condition[reach.cond]
            };
          }
        });
      }

      // iterate the completed request counter
      completed_requests++;

      // if at the end, process results
      if (completed_requests == stateList.length) {

        // invoke the callback and pass back the full list of observations
        callback(reachLevels);
      }
    });
  });
};
exports.getReachLevels = getReachLevels;

// iterate the states and create a master states list
var getStateList = function (callback) {

  // a place to put the results
  var stateListResult = [];

  // track completed requests
  var completed_requests = 0;

  // iterate the list of states
  stateList.forEach( function(state) {

    // create request options
    var options = {
      uri: 'http://www.americanwhitewater.org/content/River/state-summary/state/' + state + '/.json',
      port: 80,
      json: true
    };

    // make request
    request(options, function (err, res, body) {

      // for every reach in the response
      body.forEach( function(reach) {

          // add the state to the list
          stateListResult.push({
            abbreviation: state,
            awState: reach.state
          });
      });

      // iterate the completed request counter
      completed_requests++;

      // if at the end, process results
      if (completed_requests == stateListResult.length) {

        // create a list of unique states
        var uniqueStateList = _.uniq(stateListResult.sort);

        // invoke the callback and pass back the state list
        callback(uniqueStateList.sorted());
      }
    });
  });
};
exports.getStateList = getStateList;