const filter = require('through2-filter');
const _ = require('lodash');
const logger = require('pelias-logger').get('wof-pip-service:filterOutHierarchylessNeighbourhoods');

// This filter stream returns false when wof:placetype = neighbourhood AND
// wof:hierarchy is empty
// returns true otherwise
//
// It's needed because there are some unfortunate important WOF neighbourhoods
// that are currently incomplete
module.exports.create = function create() {
  return filter.obj(wofData => {
    // in this case, conformsTo cleans up a somewhat messy if statement
    if (_.conformsTo(wofData.properties, {
      'wof:placetype': placetype => placetype === 'neighbourhood',
      'wof:hierarchy': hierarchy => _.isEmpty(hierarchy)
    })) {
      logger.debug(`skipping ${wofData.properties['wof:id']}: neighbourhood with empty hierarchy`);
      return false;
    }

    return true;
  });
};
