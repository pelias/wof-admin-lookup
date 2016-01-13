var through2 = require('through2');
var _ = require('lodash');

function createLookupStream(resolver) {
  return through2.obj(function(doc, enc, callback) {
    // don't do anything if there's no centroid
    if (Object.keys(doc.getCentroid()).length === 0) {
      return callback(null, doc);
    }

    resolver(doc.getCentroid(), function(result) {
      if (!_.isUndefined(result.country)) {
        doc.setAdmin( 'admin0', result.country);
      }
      if (!_.isUndefined(result.region)) {
        doc.setAdmin( 'admin1', result.region);
      }
      if (!_.isUndefined(result.county)) {
        doc.setAdmin( 'admin2', result.county);
      }
      if (!_.isUndefined(result.locality)) {
        doc.setAdmin( 'locality', result.locality);
      }
      if (!_.isUndefined(result.localadmin)) {
        doc.setAdmin( 'local_admin', result.localadmin);
      }
      if (!_.isUndefined(result.neighbourhood)) {
        doc.setAdmin( 'neighborhood', result.neighbourhood);
      }

      callback(null, doc);

    });

  });

}

module.exports = {
  createLookupStream: createLookupStream
};
