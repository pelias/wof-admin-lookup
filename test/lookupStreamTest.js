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
      new Document( 'whosonfirst', 'placetype', '1')
    ];

    var lookupStream = stream.createLookupStream({});

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, input, 'nothing should have changed');
      t.end();
    });

  });

  test.test('country, macroregion, region, macrocounty, ' +
    'county, locality, localadmin, borough, and neighborhood ' +
    'fields should be set into document', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'Country 1', '1')
        .addParent('macroregion', 'Macroregion 1', '3')
        .addParent('region', 'Region 1', '5')
        .addParent('macrocounty', 'Macrocounty 1', '7')
        .addParent('county', 'County 1', '9')
        .addParent('locality', 'Locality 1', '11')
        .addParent('localadmin', 'LocalAdmin 1', '13')
        .addParent('borough', 'Borough 1', '15')
        .addParent('neighbourhood', 'Neighbourhood 1', '17')
    ];

    var resolver = {
      lookup: function (centroid, callback) {
        var result = {
          country: [
            {id: 1, name: 'Country 1'},
            {id: 2, name: 'Country 2'}
          ],
          macroregion: [
            {id: 3, name: 'Macroregion 1'},
            {id: 4, name: 'Macroregion 2'}
          ],
          region: [
            {id: 5, name: 'Region 1'},
            {id: 6, name: 'Region 2'}
          ],
          macrocounty: [
            {id: 7, name: 'Macrocounty 1'},
            {id: 8, name: 'Macrocounty 2'}
          ],
          county: [
            {id: 9, name: 'County 1'},
            {id: 10, name: 'County 2'}
          ],
          locality: [
            {id: 11, name: 'Locality 1'},
            {id: 12, name: 'Locality 2'}
          ],
          localadmin: [
            {id: 13, name: 'LocalAdmin 1'},
            {id: 14, name: 'LocalAdmin 2'}
          ],
          borough: [
            {id: 15, name: 'Borough 1'},
            {id: 16, name: 'Borough 2'},
          ],
          neighbourhood: [
            {id: 17, name: 'Neighbourhood 1'},
            {id: 18, name: 'Neighbourhood 2'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'all fields should have been set');
      t.end();
    });

  });

  test.test('resolver with field-less result should only set fields that are present', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 }),
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('region', 'Region', '1'),
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
        .addParent('country', 'Country', '2')
    ];

    var resolver = {
      lookup: function (centroid, callback) {
        if (_.isEqual(centroid, {lat: 12.121212, lon: 21.212121})) {
          setTimeout(callback, 0, null, {region: [{id: 1, name: 'Region'}]});
        } else if (_.isEqual(centroid, {lat: 13.131313, lon: 31.313131})) {
          setTimeout(callback, 0, null, {country: [{id: 2, name: 'Country'}]});
        }
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'result with missing fields should not set anything in doc');
      t.end();
    });

  });

  test.test('resolver throwing error should push doc onto stream unmodified', function(t) {
    var input = new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 });

    var expected = new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 });

    var resolver = {
      lookup: function (centroid, callback) {
        setTimeout(callback, 0, 'this is an error', {region: 'Region'});
      }
    };

    var config = {
      imports: { adminLookup: { maxConcurrentReqs: 1 } }
    };
    var lookupStream = stream.createLookupStream(resolver, config);

    var input_stream = event_stream.readArray([input]);
    var destination_stream = event_stream.writeArray(function() {
      t.fail('this stream should not have been called');
      t.end();
    });

    input_stream.pipe(lookupStream).on('error', function(e) {
      t.equal(e.message, 'PIP server failed: "this is an error"');
      t.deepEqual(input, expected, 'the document should not have been modified');
      t.end();
    }).pipe(destination_stream);

  });

  test.test('abbreviation supporting country and region should set region abbreviation', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAlpha3('USA')
        .addParent('country', 'United States', '1', 'USA')
        .addParent('region', 'Pennsylvania', '3', 'PA')
    ];

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          country: [
            {id: 1, name: 'United States', abbr: 'USA'}
          ],
          region: [
            {id: 3, name: 'Pennsylvania'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'region abbreviation should have been set');
      t.end();
    });

  });

  test.test('supported country and unsupported region should not set region abbreviation', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAlpha3('USA')
        .addParent('country', 'United States', '1', 'USA')
        .addParent('region', 'unknown US state', '3')
    ];

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          country: [
            {id: 1, name: 'United States', abbr: 'USA'}
          ],
          region: [
            {id: 3, name: 'unknown US state'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'no region abbreviation should have been set');
      t.end();
    });

  });

  test.test('unsupported country and supported region should not set region abbreviation', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'unsupported country', '1')
        .addParent('region', 'Pennsylvania', '3')
    ];

    var resolver = {
      lookup: function (centroid, callback) {
        var result = {
          country: [
            {id: 1, name: 'unsupported country'}
          ],
          region: [
            {id: 3, name: 'Pennsylvania'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'no region abbreviation should have been set');
      t.end();
    });

  });

  test.test('no countries or regions should not set region abbreviation', function(t) {
    var inputDoc = new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 });

    var expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'locality', 'Locality', '1');

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          locality: [
            {id: 1, name: 'Locality'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream([inputDoc], lookupStream, function(err, actual) {
      t.deepEqual(actual, [expectedDoc], 'no region abbreviation should have been set');
      t.end();
    });

  });

  test.test('supported country should have alpha3 set', function(t) {
    var inputDoc = new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 });

    var expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
        .setAlpha3('DNK')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'country', 'Denmark', '1', 'DNK');

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          country: [
            {id: 1, name: 'Denmark', abbr: 'DNK'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream([inputDoc], lookupStream, function(err, actual) {
      t.deepEqual(actual, [expectedDoc], 'alpha3 should have been set');
      t.end();
    });

  });

  test.test('empty string in place name should not error', function(t) {
    var inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 });

    var expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setAlpha3('DNK')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'Denmark', '1', 'DNK');

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          country: [
            {id: 1, name: 'Denmark', abbr: 'DNK'}
          ],
          county: [
            {id: 2, name: ''}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    t.doesNotThrow( function () {

      test_stream([inputDoc], lookupStream, function (err, actual) {
        t.deepEqual(actual, [expectedDoc], 'county should not be set');
        t.end();
      });
    });

  });

  test.test('first dependency should be used as region when there are no regions', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('region', 'Dependency 1', '11')
    ];

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          dependency: [
            {id: 11, name: 'Dependency 1'},
            {id: 12, name: 'Dependency 2'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'all fields should have been set');
      t.end();
    });

  });

  test.test('region should be set to first region when regions and dependencies are both available', function(t) {
    var input = [
      new Document( 'whosonfirst', 'placetype', '1').setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    var expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('region', 'Region 1', '11')
    ];

    var resolver = {
      lookup: function(centroid, callback) {
        var result = {
          region: [
            {id: 11, name: 'Region 1'},
            {id: 12, name: 'Region 2'}
          ],
          dependency: [
            {id: 13, name: 'Dependency 1'},
            {id: 14, name: 'Dependency 2'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    var lookupStream = stream.createLookupStream(resolver);

    test_stream(input, lookupStream, function(err, actual) {
      t.deepEqual(actual, expected, 'all fields should have been set');
      t.end();
    });

  });

  test.test('call end to stop child processes', function (t) {
    t.plan(2);

    var resolver = {
      end: function () {
        t.assert(true, 'called end function');
        t.equals(resolver, this, 'this is set to the correct object');
        t.end();
      }
    };

    var lookupStream = stream.createLookupStream(resolver);
    lookupStream.end();

  });

});
