/* global require */

// import modules
var request = require('request');
var aw = require('./aw');
var arcgisSecurity = require('./arcgisSecurity');

// get credentials from a file
var config = require('./resources/arcgis_config.json');

// place to save AW Levels
var awLevels = {};

// consolidate error handling
const handleErrors = function (err, res, data, callback) {

  // if a Node error is encountered
  if (err) {
    new Error(err);

    // if the status code is anything other than 200, usually indicates a problem with the service
  } else if (res.statusCode != 200) {
    new Error(data);

    // if the body contains an error response in the body - commonly how with ArcGIS reports errors
  } else if (data.error) {
    new Error(data.error);

  } else {
    callback(data);

  }
};

// update the reach hydroline levels
var pushHydrolineLevels = function () {

  // create a request object with some defaults for the reach points
  var reachHydrolineRequest = request.defaults({
    baseUrl: config.featureServices.reachLine,  // url stored in config file
    json: true
  });

  // call the push levels function with the request for hydrolines
  pushLevels(reachHydrolineRequest, function () {
    console.log('Successfully updated hydroline levels.');
  });
};
exports.pushHydrolineLevels = pushHydrolineLevels;

// update reach point levels
var pushPointLevels = function () {

  // create a request object with some defaults for the reach points
  var reachPointRequest = request.defaults({
    baseUrl: config.featureServices.reachPoint,  // url stored in config file
    json: true
  });

  // call the push levels function with the request for hydrolines
  pushLevels(reachPointRequest, function () {
    console.log('Successfully updated point levels.');
  });
};
exports.pushPointLevels = pushPointLevels;

// get the maximum number of records returned in a single rest call with attributes
var pushLevels = function (requestObject, callback) {

  // get a user token
  arcgisSecurity.getUserToken(
    config.arcgisCredentials.username, config.arcgisCredentials.password, function (accessToken) {

    const options = {
      uri: '',
      qs: {
        f: 'json',
        token: accessToken
      }
    };

    // get the maximum number of records to be returned for a request with attributes
    requestObject(options, function (err, res, body) {

      // manage errors
      handleErrors(err, res, body, function (data) {

        // pull the max records out of the JSON response
        pushFeatureBlocks(requestObject, accessToken, data.maxRecordCount, callback);
      })
    });
  });
};

// create a dictionary of key as reachid and value as objectid
var pushFeatureBlocks = function (requestObject, accessToken, maxRecordCount, callback) {

  const options = {
    uri: 'query',
    method: 'post',
    form: {
      f: 'json',
      token: accessToken,
      where: '1=1',
      returnIdsOnly: true
    }
  };

  // since the only full list returned will be all the object ids, get this full list
  requestObject(options, function (err, res, body) {

    // if some sort of error is encountered
    handleErrors(err, res, body, function(data){

      // save a couple of properties, the object id list, and the number of blocks needed to get all features
      var objectIdList = data.objectIds;
      var blockCount = Math.ceil(objectIdList.length / maxRecordCount);

      // iterate the number of blocks
      for (var i = 0; i < blockCount; i++) {

        // create a list of object ids to retrieve, the next block of object id's
        var objectIds = objectIdList.splice(0, maxRecordCount).join(',');

        // call push single hash
        pushFeatureBlock(requestObject, accessToken, objectIds, callback);
      }
    });
  });
};

// push a single hash block
var pushFeatureBlock = function (requestObject, accessToken, objectIds, callback) {

  const options = {
    uri: 'query',
    method: 'post',
    form: {
      f: 'json',
      token: accessToken,
      where: '1=1',
      obejctIds: objectIds,
      outFields: 'OBJECTID, reach_id',
      returnGeometry: false,
      returnIdsOnly: false
    }
  };

  // get the object id's and associated reach id's for this block of river reaches
  requestObject(options, function (err, res, body) {

    handleErrors(err, res, body, function(data){

      // send the features to the level update function
      pushLevelsToFeatureService(requestObject, accessToken, data.features, callback)
    });
  });
};

// wrapper for get reach levels, to ensure the levels are only retrieved once
var getAwLevels = function (callback) {

  // if the object has any properties, the levels have already been populated
  if (Object.keys(awLevels).length) {

    // invoke the callback with the levels
    callback(awLevels);

  } else {

    // get the levels from AW and pass them into the callback
    aw.getReachLevels(function (responseLevels) {

      // save the levels for next time
      awLevels = responseLevels;

      // invoke the callback
      callback(awLevels);
    });
  }
};

// push updated levels to the feature service
var pushLevelsToFeatureService = function (requestObject, accessToken, features, callback) {

  // get the levels from aw
  getAwLevels(function (reachLevels) {

    // variable to store the features with gauge readings
    var updateFeatures = [];

    // iterate the features from the feature service
    for (var i in features) {

      // if the reach has a gauge
      if (reachLevels[features[i].attributes.reach_id]) {

        // update the properites of the feature using the corresponding levels
        features[i].attributes.condition = reachLevels[features[i].attributes.reach_id].condition;
        features[i].attributes.gauge_observation = reachLevels[features[i].attributes.reach_id].stage;

        // add the feature to the list to be updated
        updateFeatures.push(features[i]);
      }
    }

    const options = {
      uri: 'applyEdits',
      method: 'post',
      form: {
        f: 'json',
        token: accessToken,
        updates: JSON.stringify(updateFeatures),
        rollbackOnFailure: true,
        useGlobalIds: false
      }
    };

    // use the updated features list to update the feature service
    requestObject(options, function (err, res, body) {

      handleErrors(err, res, body, function(data){

        // invoke the callback...life is good
        callback(data);
      });
    });
  });
};