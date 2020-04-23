const path = require('path');
const sink = require('through2-sink');
const config = require('pelias-config').generate(require('../../schema')).imports.whosonfirst;
const whosonfirst = require('pelias-whosonfirst');
const extractFields = require('./components/extractFields');
const simplifyGeometry = require('./components/simplifyGeometry');
const filterOutCitylessNeighbourhoods = require('./components/filterOutCitylessNeighbourhoods');
const filterOutHierarchylessNeighbourhoods = require('./components/filterOutHierarchylessNeighbourhoods');
const filterOutPointRecords = require('./components/filterOutPointRecords');
const combinedStream = require('combined-stream');
const fs = require('fs');
const SQLiteStream = whosonfirst.SQLiteStream;

const SQLITE_REGEX = /whosonfirst-data-[a-z0-9-]+\.db$/;

function getSqliteFilePaths(root) {
  return fs.readdirSync(root)
    .filter(d => SQLITE_REGEX.test(d))
    .map(db => path.join(root, db));
}

function readSqliteRecords(datapath, layer) {
  const sqliteStream = combinedStream.create();
  getSqliteFilePaths(path.join(datapath, 'sqlite')).forEach(dbPath => {
    sqliteStream.append(next => {
      next(new SQLiteStream(
        dbPath,
        config.importPlace ?
        SQLiteStream.findGeoJSONByPlacetypeAndWOFId(layer, config.importPlace) :
        SQLiteStream.findGeoJSONByPlacetype(layer)
      ));
    });
  });
  return sqliteStream.pipe(whosonfirst.toJSONStream());
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

  readSqliteRecords(datapath,layer)
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
