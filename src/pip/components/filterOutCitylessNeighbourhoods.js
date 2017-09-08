const filter = require('through2-filter');
const _ = require('lodash');
const logger = require('pelias-logger').get('wof-pip-service:filterOutCitylessNeighbourhoods');

// This filter stream returns false when wof:placetype = neighbourhood AND
// wof:hierarchy lacks both locality_id AND localadmin_id
// returns true otherwise
//
// It's needed because there are some unfortunate important WOF neighbourhoods
// that are currently incomplete
module.exports.create = function create() {
  return filter.obj(wofData => {
    // in this case, conformsTo cleans up a somewhat messy if statement
    if (_.conformsTo(wofData.properties, {
      'wof:placetype': placetype => placetype === 'neighbourhood',
      'wof:hierarchy': hierarchy => !_.has(hierarchy[0], 'locality_id') && !_.has(hierarchy[0], 'localadmin_id')
    })) {
      logger.debug(`skipping ${wofData.properties['wof:id']}: neighbourhood without locality or localadmin`);
      return false;
    }

    return true;
  });
};
