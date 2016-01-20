var _ = require('lodash');
var logger = require('pelias-logger').get('wof-admin-lookup');
var parallelStream = require('pelias-parallel-stream');
var peliasConfig = require( 'pelias-config' ).generate();


function createLookupStream(resolver) {

  var maxConcurrentReqs = 100;
  if (peliasConfig.adminLookup && peliasConfig.adminLookup.maxConcurrentReqs) {
    maxConcurrentReqs = peliasConfig.adminLookup.maxConcurrentReqs;
  }

  return parallelStream(maxConcurrentReqs, function (doc, enc, next) {

    // skip if there's no centroid
    if (_.isEmpty(doc.getCentroid())) {
      logger.error('No centroid, skipping admin-lookup / indexing');
      return next(null, doc); // TBD: this might need to be called asynchronously
    }

    resolver(doc.getCentroid(), function (err, pipResult) {

      // assume errors at this point are fatal, so pass them upstream to kill stream
      if (err) {
        logger.error(err);
        return next(new Error('PIP server failed:' + err.message));
      }

      var parentProperties = ['country', 'region', 'county', 'locality', 'localadmin', 'neighbourhood'];

      parentProperties.forEach(function (prop) {
        addParent(pipResult, doc, prop);
      });

      next(null, doc);
    });
  });
}

/**
 * Set parent property along with corresponding id and abbreviation
 *
 * @param {object} result
 * @param {object} doc
 * @param {string} propName
 */
function addParent(result, doc, propName) {
  if (!_.isUndefined(result[propName])) {
    if (!_.isUndefined(result[propName + '_abbr'])) {
      doc.addParent(
        propName,
        result[propName],
        result[propName + '_id'] || result[propName], // TBD: update this to throw an error when id doesn't exist
        result[propName + '_abbr']
      );
    }
    else {
      doc.addParent(
        propName,
        result[propName],
        result[propName + '_id'] || result[propName] // TBD: update this to throw an error when id doesn't exist
      );
    }
  }
}

module.exports = {
  createLookupStream: createLookupStream
};
