'use strict';

var logger = require('pelias-logger').get('wof-admin-lookup');
var createPIPService = require('pelias-wof-pip-service').create;

/**
 * LocalPIPService class
 *
 * @param {object} [lookupService] optional, primarily used for testing
 * @constructor
 */
function LocalPIPService(lookupService, layers) {

  this.lookupService = lookupService || null;

  if (!this.lookupService) {
    var self = this;
    createPIPService(layers, function (err, service) {
      self.lookupService = service;
    });
  }
}

/**
 * @param {object} centroid
 * @param {number} centroid.lat
 * @param {number} centroid.lon
 * @param callback
 */
LocalPIPService.prototype.lookup = function lookup(centroid, callback, search_layers) {

  var self = this;

  // in the case that the lookup service hasn't loaded yet, sleep and come back in 5 seconds
  if (!self.lookupService) {
    setTimeout(function () {
      self.lookup(centroid, callback);
    }, 1000 * 5);
    return;
  }

  self.lookupService.lookup(centroid.lat, centroid.lon, function (err, results) {

    // convert the array to an object keyed on the array element's Placetype field
    var result = results.reduce(function (obj, elem) {
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

      obj[elem.Placetype].push(parent);
      return obj;
    }, {});

    callback(err, result);
  }, search_layers);
};

/**
 * Signal the underlying admin lookup child processes to shut down
 */
LocalPIPService.prototype.end = function end() {
  if (this.lookupService) {
    logger.debug('Shutting down admin lookup service');
    this.lookupService.end();
  }
};

/**
 * Factory function
 *
 * @param {object} [service]
 * @returns {LocalPIPService}
 */
function createLocalPipResolver(service, layers) {
  return new LocalPIPService(service, layers);
}

module.exports = createLocalPipResolver;
