var util = require('util');
var http = require('http');

function createWofPipResolver(url) {
  var baseUrl = url;

  return function(centroid, callback) {
    var url = util.format('%s/?latitude=%d&longitude=%d', baseUrl, centroid.lat, centroid.lon);

    http.get(url, function(response) {
      var contents = '';

      response.setEncoding('utf8');
      response.on('data', function(data) { contents += data; } );
      response.on('end', function() {
        // convert the array to an object keyed on the array element's Placetype field
        var result = JSON.parse(contents).reduce(function(obj, elem) {
          obj[elem.Placetype] = elem.Name;
          return obj;
        }, {});

        return callback(null, result);

      });

    }).on('error', function(err) {
      return callback(err, null);
    });

  };

}

module.exports = {
  createWofPipResolver: createWofPipResolver
};
