var util = require('util');
var http = require('http');
var request = require('request');
var peliasConfig = require( 'pelias-config' ).generate();


function createWofPipResolver(url, config) {
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
    var urlPath = util.format('%s/?latitude=%d&longitude=%d', url, centroid.lat, centroid.lon);

    var options = {
      method: 'GET',
      url: urlPath,
      agent: httpAgent
    };

    request(options, function (err, res, body) {
      if (err) {
        console.log(err.stack);
        return callback(err, null);
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

module.exports = {
  createWofPipResolver: createWofPipResolver
};
