const _ = require('lodash');
const through2 = require('through2');
const buffer = require('@turf/buffer');
const meta = require('@turf/meta');
const logger = require('pelias-logger').get('wof-pip-service:bufferPointRecords');
const options = { units: 'degrees', steps: 64 };
const defaultRadius = 0.02;

// selectively convert some points to 'buffered geometries'.
// ie. draw a circle around the point to convert it to a polygon.
// note: currently only enable for the United Kingdom
module.exports.create = function create( radius ) {
  return through2.obj(function(wofData, _, next) {
    if( wofData.geometry.type === 'Point' && isInUK(wofData) ){
      try {
        var buf = buffer( wofData.geometry, radius || defaultRadius, options );

        // truncate coordinate precision
        // https://github.com/Turfjs/turf/issues/357
        meta.coordEach(buf.geometry, function (p) {
          p[0] = Math.round(p[0] * 1e7) / 1e7;
          p[1] = Math.round(p[1] * 1e7) / 1e7;
        });

        wofData.geometry = buf.geometry;
      }
      catch( err ){
        logger.debug(`failed to buffer ${wofData.properties['wof:id']}: ${err.message}`);
      }
    }
    this.push(wofData);
    next();
  });
};

// this function is used to verify that the wof record is within the United Kingdom
function isInUK(wofData) {

  // sanity checking
  if( !wofData || !_.isPlainObject( wofData.properties ) ){ return false; }

  // use the iso property where available
  var iso = wofData.properties['iso:country'];
  if( 'string' === typeof iso && iso.trim().length > 0 ){
    return iso.trim().toUpperCase() === 'GB';
  }

  // iterate the hierarchy lto see if the 'country_id' is set
  var hierarchy = wofData.properties['wof:hierarchy'] || [];
  for( var i=0; i<hierarchy.length; i++ ){
    switch( hierarchy[i].country_id ){
      case 85633159: return true; // United Kingdom wofid
      case '85633159': return true; // as string too
    }
  }

  return false;
}

module.exports.isInUK = isInUK;