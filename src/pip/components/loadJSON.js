var path = require('path');
var through = require('through2');
var logger = require( 'pelias-logger' ).get( 'wof-pip-service:loadJSON' );
var fs = require('fs');

module.exports.create = function(datapath) {
  // parse and return JSON contents
  return through.obj(function(record, enc, next) {
    var filename = [ datapath, 'data', record.path ].join(path.sep);

    try {
      this.push(JSON.parse(fs.readFileSync(filename)));
    }
    catch (e) {
      logger.error('exception occured parsing ' + filename + ': ' + e);
    }

    next();
  });
};
