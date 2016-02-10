/* global require */
'use strict';

// import module and funciton
var getCurrentGauge = require('./usgs').getCurrentGauge;

// expose capability
exports.getCurrentGauge = getCurrentGauge;
