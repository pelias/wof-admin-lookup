'use strict';

const logger = require('pelias-logger').get('wof-admin-lookup');
const createPipService = require('./pip/index').create;
const _ = require('lodash');

/**
 * LocalPIPService class
 *
 * @param {object} [pipService] optional, primarily used for testing
 * @constructor
 */
function LocalPipService(datapath, layers) {
  const self = this;

  createPipService(datapath, _.defaultTo(layers, []), false, (err, service) => {
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
  }
};

/**
 * Factory function
 *
 * @param {object} [service]
 * @param {string} [datapath]
 * @returns {LocalPIPService}
 */
module.exports = (datapath, layers) => {
  return new LocalPipService(datapath, layers);
};
