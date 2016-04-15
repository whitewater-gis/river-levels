/* global require */

// import modules
var arcgis = require('./arcgis');

// single update point of reference
exports.handler = function (event, context) {

  // update the hydroline levels
  arcgis.pushHydrolineLevels(
    // update the hydropoint levels
    arcgis.pushPointLevels(
      // return success message
      function () {
        context.succeed({
            message: 'All levels successfully updated.'
          }
        )
      }
    )
  );
};