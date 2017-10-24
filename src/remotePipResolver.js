'use strict';

const url = require('url');
const logger = require('pelias-logger').get('wof-admin-lookup');
const _ = require('lodash');
const request = require('request');

const ServiceConfiguration = require('pelias-microservice-wrapper').ServiceConfiguration;
const service = require('pelias-microservice-wrapper').service;

class PointInPolygon extends ServiceConfiguration {
  constructor(o) {
    super('pip', o);
  }

  getUrl(params) {
    // use resolve to eliminate possibility of duplicate /'s in URL
    return url.resolve(this.baseUrl, `${params.lon}/${params.lat}`);
  }
}

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
      console.log(err);
      return callback(err.message);
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
