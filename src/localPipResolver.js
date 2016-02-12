var createPIPService = require('pelias-wof-pip-service').create;

function createLocalPipResolver(service) {

  var lookupService = service || null;

  return function (centroid, callback) {

    if (!lookupService) {
      createPIPService(function (err, service) {
        lookupService = service;
        lookup(lookupService, centroid, callback);
      });
    }
    else {
      lookup(lookupService, centroid, callback);
    }
  };
}

function lookup(service, centroid, callback) {
  service.lookup(centroid.lat, centroid.lon, function (err, results) {

    // convert the array to an object keyed on the array element's Placetype field
    var result = results.reduce(function (obj, elem) {
      if (!obj.hasOwnProperty(elem.Placetype)) {
        obj[elem.Placetype] = [];
      }
      obj[elem.Placetype].push({
        id: elem.Id,
        name: elem.Name
      });
      return obj;
    }, {});

    callback(err, result);
  });
}

module.exports = createLocalPipResolver;