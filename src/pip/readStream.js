const path = require('path');
const sink = require('through2-sink');
const config = require('pelias-config').generate(require('../../schema')).imports.whosonfirst;
const whosonfirst = require('pelias-whosonfirst');
const extractFields = require('./components/extractFields');
const simplifyGeometry = require('./components/simplifyGeometry');
const filterOutCitylessNeighbourhoods = require('./components/filterOutCitylessNeighbourhoods');
const filterOutHierarchylessNeighbourhoods = require('./components/filterOutHierarchylessNeighbourhoods');
const filterOutPointRecords = require('./components/filterOutPointRecords');
const SQLiteStream = whosonfirst.SQLiteStream;

function readBundleRecords(datapath, layer) {
  return whosonfirst.metadataStream(datapath).create(layer)
    .pipe(whosonfirst.parseMetaFiles())
    .pipe(whosonfirst.isNotNullIslandRelated())
    .pipe(whosonfirst.recordHasName())
    .pipe(whosonfirst.loadJSON(datapath, false));
}

function readSqliteRecords(datapath, layer) {
  return new SQLiteStream(
    path.join(datapath, 'sqlite', 'whosonfirst-data-latest.db'),
    config.importPlace ?
    SQLiteStream.findGeoJSONByPlacetypeAndWOFId(layer, config.importPlace) :
    SQLiteStream.findGeoJSONByPlacetype(layer)
  ).pipe(whosonfirst.toJSONStream());
}

/**
 * This function loads a WOF metadata file, CSV parses it, extracts fields,
 * pushes the ids onto an array, and calls the callback
 *
 * @param {string} datapath bundle path if string or sqlite or bundle when object
 * @param {string} layer
 * @param {boolean} localizedAdminNames
 * @param {function} callback
 */
function readData(datapath, layer, localizedAdminNames, callback) {
  const features = [];

  const stream = config.sqlite === true ?
    readSqliteRecords(datapath, layer) :
    readBundleRecords(datapath, layer);

  stream
    .pipe(whosonfirst.recordHasIdAndProperties())
    .pipe(whosonfirst.isActiveRecord())
    .pipe(filterOutPointRecords.create())
    .pipe(filterOutHierarchylessNeighbourhoods.create())
    .pipe(filterOutCitylessNeighbourhoods.create())
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