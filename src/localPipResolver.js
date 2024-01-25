'use strict';

const logger = require('pelias-logger').get('wof-admin-lookup');
const createPipService = require('./pip/index').create;
const killAllWorkers = require('./pip/index').killAllWorkers;
const _ = require('lodash');

/**
 * LocalPIPService class
 *
 * @param {string} datapath
 * @param {Array} [layers]
 * @param {boolean} [localizedAdminNames]
 * @constructor
 */
function LocalPipService(datapath, layers, localizedAdminNames) {
  const self = this;

  createPipService(datapath, _.defaultTo(layers, []), localizedAdminNames, (err, service) => {
    if (err) {
      throw err;
    }
    self.pipService = service;
  });
}

/**
 * @param {object} centroid
 * @param {array} search_layers
 * @param callback
 */
LocalPipService.prototype.lookup = function lookup(centroid, search_layers, callback) {
  const self = this;

  // in the case that the lookup service hasn't loaded yet, sleep and come back in 5 seconds
  if (!self.pipService) {
    setTimeout(() => {
      self.lookup(centroid, search_layers, callback);
    }, 1000 * 5);
    return;
  }

  self.pipService.lookup(centroid.lat, centroid.lon, search_layers, (err, results) => {

    // convert the array to an object keyed on the array element's Placetype field
    const result = results.reduce((obj, elem) => {
      if (!obj.hasOwnProperty(elem.Placetype)) {
        obj[elem.Placetype] = [];
      }

      const parent = {
        id: elem.Id,
        name: elem.Name
      };

      if (elem.hasOwnProperty('Abbrev')) {
        parent.abbr = elem.Abbrev;
      }
      if (elem.hasOwnProperty('Centroid')) {
        parent.centroid = elem.Centroid;
      }
      if (elem.hasOwnProperty('BoundingBox')) {
        parent.bounding_box = elem.BoundingBox;
      }

      obj[elem.Placetype].push(parent);
      return obj;
    }, {});

    callback(err, result);
  });
};

/**
 * Signal the underlying admin lookup child processes to shut down
 */
LocalPipService.prototype.end = function end() {
  if (this.pipService) {
    logger.info('Shutting down admin lookup service');
    this.pipService.end();
  } else {
    /**
     * this is required to handle the case where the '$this.pipService'
     * variable is not available yet but the stream has ended and needs to
     * terminate all workers, such as when the stream input is /dev/null.
    */
    logger.info('Shutting down admin lookup service');
    logger.info('Ensure your input file is valid before retrying');
    killAllWorkers();
  }
};

/**
 * Factory function
 *
 * @param {string} datapath
 * @param {Array} [layers]
 * @param {boolean} [localizedAdminNames]
 * @returns {LocalPIPService}
 */
module.exports = (datapath, layers, localizedAdminNames) => {
  return new LocalPipService(datapath, layers, localizedAdminNames);
};
