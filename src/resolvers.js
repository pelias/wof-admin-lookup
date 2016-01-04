var util = require('util');
var http = require('http');

var baseUrl;

function createWofPipResolver(url) {
  baseUrl = url;

  return function(centroid, callback) {
    var url = util.format('%s/?latitude=%d&longitude=%d', baseUrl, centroid.lat, centroid.lon);

    http.get(url, function(response) {
      var contents = '';

      var result = {};

      response.setEncoding('utf8');
      response.on('data', function(data) { contents += data } );
      response.on('end', function() {
        JSON.parse(contents).forEach(function(row) {
          switch (row.Placetype) {
            case 'country':
              result.country = row.Name;
              break;
            case 'region':
              result.region = row.Name;
              break;
            case 'county':
              result.county = row.Name;
              break;
            case 'locality':
              result.locality = row.Name;
              break;
            case 'neighbourhood':
              result.neighbourhood = row.Name;
              break;
          }

        });

        return callback(result);

      });
    });

  }

}

module.exports = {
  createWofPipResolver: createWofPipResolver
}
