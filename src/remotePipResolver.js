'use strict';

const logger = require('pelias-logger').get('wof-admin-lookup');
const _ = require('lodash');
const request = require('request');
const http = require('http');

// Use one HTTP agent with HTTP keep alive enabled across all requests
const keepAliveAgent = new http.Agent({ keepAlive: true });

/**
 * RemotePIPService class
 *
 * @param {string} [url] url to pip service
 * @constructor
 */
function RemotePIPService(url) {
  this.pipServiceURL = url;
}

/**
 * @param {object} centroid
 * @param {array} _ - previously search_layers. it's not using anymore, but stays here for backward compatibility
 * @param callback
 */
RemotePIPService.prototype.lookup = function lookup(centroid, _, callback) {

  const options = {
    uri: `${this.pipServiceURL}/${centroid.lon}/${centroid.lat}`,
    method: 'GET',
    agent: keepAliveAgent,
    json: true
  };

  request(options, (err, response, results) => {
    if (err) {
      return callback(err.message);
    }

    if (response.statusCode !== 200) {
      return callback(results);
    }

    callback(null, results);
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
