/* global require, exports */

// import modules
const request = require('request');

// consolidate error handling
const handleErrors = function(err, res, data, callback){

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

// get a token using an ArcGIS Online username and password
var getUserToken = function (username, password, callback) {

  // options for the request
  const options = {
    uri: 'https://www.arcgis.com/sharing/rest/generateToken',
    method: 'post',
    form: {
      username: username,
      password: password,
      referer: 'requestip',
      expiration: 1440,
      f: 'json'
    }
  };

  // make the request to get the token
  request(options, function (err, res, body) {

    // catch errors
    handleErrors(err, res, body, function(data){

      // write the token to the variable, pulling it out of the response returned stringified from the server
      callback(JSON.parse(data).token);
    });
  });
};
exports.getUserToken = getUserToken;

// get a token using an application id and secret
var getApplicationToken = function (client_id, cleint_secret, callback) {

  // options for the request
  const options = {
    uri: 'https://www.arcgis.com/sharing/rest/oauth2/token/',
    method: 'post',
    form: {
      client_id: client_id,
      client_secret: client_secret,
      grant_type: 'client_credentials',
      expiration: 1440,
      f: 'json'
    }
  };

  // make the request to get the token
  request(options, function (err, res, body) {

    // catch errors
    handleErrors(err, res, body, function(data){

      // write the token to the variable, pulling it out of the response returned stringified from the server
      callback(data.access_token);
    });
  });
};
exports.getApplicationToken = getApplicationToken;