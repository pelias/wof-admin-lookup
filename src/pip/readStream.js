const sink = require('through2-sink');
const whosonfirst = require('pelias-whosonfirst');
const extractFields = require('./components/extractFields');
const simplifyGeometry = require('./components/simplifyGeometry');
const filterOutUnimportantRecords = require('./components/filterOutUnimportantRecords');
const filterOutPointRecords = require('./components/filterOutPointRecords');

/**
 * This function loads a WOF metadata file, CSV parses it, extracts fields,
 * pushes the ids onto an array, and calls the callback
 *
 * @param {string} datapath
 * @param {string} layer
 * @param {boolean} localizedAdminNames
 * @param {function} callback
 */
function readData(datapath, layer, localizedAdminNames, callback) {
  const features = [];

  whosonfirst.metadataStream(datapath).create(layer)
    .pipe(whosonfirst.parseMetaFiles())
    .pipe(whosonfirst.isNotNullIslandRelated())
    .pipe(whosonfirst.recordHasName())
    .pipe(whosonfirst.loadJSON(datapath, false))
    .pipe(whosonfirst.recordHasIdAndProperties())
    .pipe(whosonfirst.isActiveRecord())
    .pipe(filterOutPointRecords.create())
    .pipe(filterOutUnimportantRecords.create())
    .pipe(extractFields.create(localizedAdminNames))
    .pipe(simplifyGeometry.create())
    .pipe(sink.obj((feature) => {
      features.push(feature);
    }))
    .on('finish', function() {
      callback(features);
    });

}

module.exports = readData;
