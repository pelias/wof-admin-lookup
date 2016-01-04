var tape = require('tape');
var event_stream = require('event-stream');
var Document = require('pelias-model').Document;
var _ = require('lodash');

var stream = require('../src/lookupStream');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('tests', function(test) {
  test.test('doc without centroid should not modify input', function(t) {
    var input = [
      new Document( 'whosonfirst', '1')
    ];

    var lookupStream = stream.createLookupStream();

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, input, 'nothing should have changed');
      t.end();
    });

  });

  test.test('country, region, county, locality, and neighborhood fields should be set into document', function(t) {
    var input = [
      new Document( 'whosonfirst', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAdmin( 'admin0', 'Country')
        .setAdmin( 'admin1', 'Region')
        .setAdmin( 'admin2', 'County')
        .setAdmin( 'locality', 'Locality')
        .setAdmin( 'neighborhood', 'Neighbourhood')
    ];

    var resolver = function(centroid, callback) {
      var result = {
        country: 'Country',
        region: 'Region',
        county: 'County',
        locality: 'Locality',
        neighbourhood: 'Neighbourhood'
      };

      setTimeout(callback, 0, result);

    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'all fields should have been set');
      t.end();
    });

  });

  test.test('resolver with field-less result should only set fields that are present', function(t) {
    var input = [
      new Document( 'whosonfirst', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 }),
      new Document( 'whosonfirst', '1')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
    ];

    var expected = [
      new Document( 'whosonfirst', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAdmin( 'admin1', 'Region'),
      new Document( 'whosonfirst', '1')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
        .setAdmin( 'admin0', 'Country')
    ]

    var resolver = function(centroid, callback) {
      if (_.isEqual(centroid, { lat: 12.121212, lon: 21.212121 } )) {
        setTimeout(callback, 0, { region: 'Region' });
      } else if (_.isEqual(centroid, { lat: 13.131313, lon: 31.313131 })) {
        setTimeout(callback, 0, { country: 'Country' });
      }

    }

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'result with missing fields should not set anything in doc');
      t.end();
    });

  });

});
