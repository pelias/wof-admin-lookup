'use strict';

var parse = require('csv-parse');
var fs = require('fs');
var path = require('path');
var sink = require('through2-sink');
var loadJSON = require('./components/loadJSON');
var extractFields = require('./components/extractFields');
var simplifyGeometry = require('./components/simplifyGeometry');
var isActiveRecord = require('./components/isActiveRecord');
var filterOutNamelessRecords = require('./components/filterOutNamelessRecords');
var filterOutUnimportantRecords = require('./components/filterOutUnimportantRecords');

/*
  This function finds all the `latest` files in `meta/`, CSV parses them,
  pushes the ids onto an array and calls the callback
*/
function readData(datapath, layer, callback) {
  var features = [];

  var options = {
    delimiter: ',',
    columns: true
  };

  fs.createReadStream(path.join(datapath, 'meta', `wof-${layer}-latest.csv`))
    .pipe(parse(options))
    .pipe(loadJSON.create(datapath))
    .pipe(isActiveRecord.create())
    .pipe(filterOutNamelessRecords.create())
    .pipe(filterOutUnimportantRecords.create())
    .pipe(extractFields.create())
    .pipe(simplifyGeometry.create())
    .pipe(sink.obj(function(feature) {
      features.push(feature);
    }))
    .on('finish', function() {
      callback(features);
    });

}

module.exports = readData;
