/* global require */

// import modules
var aw = require('./aw');

// get the levels list
aw.getReachLevels(function (result) {
  console.log(JSON.stringify(result));
});

// get the list of states
//aw.getStateList(function(result){
//  console.log(JSON.stringify(result));
//});
