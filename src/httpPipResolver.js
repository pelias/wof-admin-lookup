var util = require('util');
var http = require('http');
var request = require('request');
var peliasConfig = require( 'pelias-config' ).generate();
var _ = require('lodash');

function createWofPipResolver(url, config) {
  // prepend url with 'http://' if not already
  var normalizedUrl = _.startsWith(url, 'http://') ? url : 'http://' + url;
  config = config || peliasConfig;

  var maxConcurrentReqs = 1;
  if (config.imports.adminLookup && config.imports.adminLookup.maxConcurrentReqs) {
    maxConcurrentReqs = config.imports.adminLookup.maxConcurrentReqs;
  }

  var httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: maxConcurrentReqs
  });

  return function(centroid, callback) {
    var urlPath = util.format('%s/?latitude=%d&longitude=%d', normalizedUrl, centroid.lat, centroid.lon);

    var options = {
      method: 'GET',
      url: urlPath,
      agent: httpAgent
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
        obj[elem.Placetype].push({
          id: elem.Id,
          name: elem.Name
        });
        return obj;
      }, {});

      return callback(null, result);

    });
  };

}

module.exports = createWofPipResolver;
