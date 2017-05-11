var fs = require('fs');
var path = require('path');
var sink = require('through2-sink');
const whosonfirst = require('pelias-whosonfirst');
var extractFields = require('./components/extractFields');
var simplifyGeometry = require('./components/simplifyGeometry');
var filterOutUnimportantRecords = require('./components/filterOutUnimportantRecords');

/**
 * This function finds all the `latest` files in `meta/`, CSV parses them,
 * pushes the ids onto an array and calls the callback
 *
 * @param {string} datapath
 * @param {string} layer
 * @param {boolean} localizedAdminNames
 * @param {function} callback
 */
function readData(datapath, layer, localizedAdminNames, callback) {
  var features = [];

  fs.createReadStream(path.join(datapath, 'meta', `wof-${layer}-latest.csv`))
    .pipe(whosonfirst.parseMetaFiles())
    .pipe(whosonfirst.isNotNullIslandRelated())
    .pipe(whosonfirst.recordHasName())
    .pipe(whosonfirst.loadJSON(datapath, false))
    .pipe(whosonfirst.recordHasIdAndProperties())
    .pipe(whosonfirst.isActiveRecord())
    .pipe(filterOutUnimportantRecords.create())
    .pipe(extractFields.create(localizedAdminNames))
    .pipe(simplifyGeometry.create())
    .pipe(sink.obj(function(feature) {
      features.push(feature);
    }))
    .on('finish', function() {
      callback(features);
    });

}

module.exports = readData;
