var tape = require('tape');

var localPipResolver = require('../src/localPipResolver');

tape('tests', function(test) {

  function makeLookupMock(t, expected, err, res) {
    return {
      end: function () {
        t.assert(true, 'called end function');
      },
      lookup: function (lat, lon, callback) {
        t.equal(lat, expected.lat, 'correct latitude is passed');
        t.equal(lon, expected.lon, 'correct longitude is passed');
        callback(err, res);
      }
    };
  }

  test.test('return value should be parsed from server response', function(t) {
    t.plan(3);

    var centroid = {
      lon: -123.145257,
      lat: 49.270478
    };

    var expectedLookupParams = {
      lat: centroid.lat,
      lon: centroid.lon
    };

    var results = [
      {
        Id: 85633041,
        Name: 'Canada',
        Placetype: 'country',
        Abbrev: 'CAN',
        Hierarchy: [
          {
            continent_id: 102191575,
            country_id: 85633041
          }
        ]
      }
    ];

    var lookupServiceMock = makeLookupMock(t, expectedLookupParams, null, results);

    var resolver = localPipResolver()(lookupServiceMock);

    var callback = function(err, result) {
      var expected = {
        country: [
          {id: 85633041, name: 'Canada', abbr: 'CAN'}
        ]
      };

      t.deepEqual(result, expected);
      t.end();
    };

    resolver.lookup(centroid, callback);

  });

});
