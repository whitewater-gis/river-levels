/* global require */

// import modules
const arcgisSecurity = require('./arcgisSecurity');

// pull in config file
const config = require('./resources/arcgis_config.json');

// test get user token
arcgisSecurity.getUserToken(config.credentials.username, config.credentials.password, function(response){
  console.log(response);
});