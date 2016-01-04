var through2 = require('through2');
var _ = require('lodash');

function createLookupStream(resolver) {
  return through2.obj(function(doc, enc, callback) {
    // don't do anything if there's no centroid
    if (Object.keys(doc.getCentroid()).length === 0) {
      this.push(doc);
      return callback();
    }

    var that = this;

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
      if (!_.isUndefined(result.neighbourhood)) {
        doc.setAdmin( 'neighborhood', result.neighbourhood);
      }

      that.push(doc);
      callback();

    });

  });

}

module.exports = {
  createLookupStream: createLookupStream
};
