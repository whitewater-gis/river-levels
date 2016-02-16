/* global require */

// import modules
var request = require('request');
var aw = require('./aw');

// get credentials from a file
var config = require('./resources/arcgis_config.json');

// place to save AW Levels
var awLevels = {};

// save the token for subesquent calls in the same run
var token;

// get a token
var getToken = function (callback) {

  // if the token already exists, just send it
  if (token) {
    callback(token);
  } else {

    // make the request to get the token
    request({
      uri: 'https://www.arcgis.com/sharing/rest/generateToken',
      method: 'post',
      form: {
        username: config.credentials.username,
        password: config.credentials.password,
        client: 'requestip',
        expiration: 60,
        f: 'json'
      }
    }, function (err, res, body) {

      // if everything is good to go
      if (!err && res.statusCode == 200 && !body.error) {

        // write the token to the varaible
        token = JSON.parse(body).token;

        // invoke the callback
        callback(token);
      }
    });
  }
};

// get the maximum number of records returned in a single rest call with attributes
var pushLevels = function (requestObject, callback) {

  getToken(function (accessToken) {

    // get the maximum number of records to be returned for a request with attributes
    requestObject({
      uri: '',
      qs: {
        f: 'json',
        token: accessToken
      }
    }, function (err, res, body) {

      if (!err && res.statusCode == 200 && !body.error){

        // pull the max records out of the JSON response
        pushFeatureBlocks(requestObject, accessToken, body.maxRecordCount, callback);
      }
    });
  });
};

// create a dictionary of key as reachid and value as objectid
var pushFeatureBlocks = function (requestObject, accessToken, maxRecordCount, callback) {

  // since the only full list returned will be all the object ids, get this full list
  requestObject({
    uri: 'query',
    method: 'post',
    form: {
      f: 'json',
      token: accessToken,
      where: '1=1',
      returnIdsOnly: true
    }
  }, function (err, res, body) {

    // if everything a-ok
    if (!err && res.statusCode == 200 && !body.error) {

      // save a couple of properties, the object id list, and the number of blocks needed to get all features
      var objectIdList = body.objectIds;
      var blockCount = Math.ceil(objectIdList.length / maxRecordCount);

      // iterate the number of blocks
      for (var i = 0; i < blockCount; i++) {

        // create a list of object ids to retrieve, the next block of object id's
        var objectIds = objectIdList.splice(0, maxRecordCount).join(',');

        // call push single hash
        pushFeatureBlock(requestObject, accessToken, objectIds, callback);
      }
    }
  });
};

// push a single hash block
var pushFeatureBlock = function (requestObject, accessToken, objectIds, callback) {

  // get the object id's and associated reach id's for this block of river reaches
  requestObject({
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
  }, function (err, res, body) {

    // ensure we get something valid back
    if (!err && res.statusCode == 200 && !body.error) {

      // send the features to the level update function
      pushLevelsToFeatureService(requestObject, accessToken, body.features, callback)
    }
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

    // use the updated features list to update the feature service
    requestObject({
      uri: 'applyEdits',
      method: 'post',
      form: {
        f: 'json',
        token: accessToken,
        updates: JSON.stringify(updateFeatures),
        rollbackOnFailure: true,
        useGlobalIds: false
      }
    }, function (err, res, body) {

      // if good to go
      if (!err && res.statusCode == 400 && !body.error) {

        // TODO: convert this into a function that can be used to provide a cloudwatch success message
        callback(body);

      }
    });
  });
};


// TODO: revise
exports.pushLevels = pushLevels;