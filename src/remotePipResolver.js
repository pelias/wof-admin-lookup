'use strict';

const logger = require('pelias-logger').get('wof-admin-lookup');
const _ = require('lodash');
const request = require('request');

const service = require('pelias-microservice-wrapper').service;
const PointInPolygon = require('./service/PointInPolygon');

/**
 * RemotePIPService class
 *
 * @param {string} [url] url to pip service
 * @constructor
 */
function RemotePIPService(url) {
  this.pipService = service(new PointInPolygon({ url: url, timeout: 5000, retries: 5}));
}

/**
 * @param {object} centroid
 * @param {array} _ - previously search_layers. it's not using anymore, but stays here for backward compatibility
 * @param callback
 */
RemotePIPService.prototype.lookup = function lookup(centroid, _, callback) {

  this.pipService(centroid, (err, response, results) => {
    if (err) {
      return callback(err);
    }

    callback(null, response);
  });
};

/**
 * Factory function
 *
 * @param {string} [url]
 * @returns {RemotePIPService}
 */
module.exports = (url) => {
  return new RemotePIPService(url);
};
