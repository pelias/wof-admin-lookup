'use strict';

var util = require('util');
var http = require('http');
var request = require('request');
var _ = require('lodash');

function RemotePIPResolver(url, maxConcurrentReqs) {
  // prepend url with 'http://' if not already
  this.normalizedUrl = _.startsWith(url, 'http://') ? url : 'http://' + url;

  this.httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: maxConcurrentReqs
  });
}

RemotePIPResolver.prototype.lookup = function lookup(centroid, callback) {
  var urlPath = util.format('%s/?latitude=%d&longitude=%d',
    this.normalizedUrl, centroid.lat, centroid.lon);

  var options = {
    method: 'GET',
    url: urlPath,
    agent: this.httpAgent
  };

  request(options, function (err, res, body) {
    // if an error occurred attempting to connect, handle it
    if (err) {
      console.error(err.stack);
      return callback(err, null);
    }

    // handle condition where a non-200 was returned
    if (res.statusCode !== 200) {
      var error = {
        centroid: centroid,
        statusCode: res.statusCode,
        text: body
      };

      console.error(JSON.stringify(error));
      return callback(error, null);
    }

    // convert the array to an object keyed on the array element's Placetype field
    var result = JSON.parse(body).reduce(function (obj, elem) {
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

    return callback(null, result);

  });
};

RemotePIPResolver.prototype.end = function end() {
  this.httpAgent.destroy();
};

module.exports = function(maxConcurrentReqs) {
  return (url) => {
    return new RemotePIPResolver(url, maxConcurrentReqs);
  };
};
