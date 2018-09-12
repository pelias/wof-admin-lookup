const tape = require('tape');
const event_stream = require('event-stream');
const Document = require('pelias-model').Document;
const _ = require('lodash');
const proxyquire = require('proxyquire').noCallThru();

const stream = require('../src/lookupStream');

function test_stream(input, testedStream, callback) {
    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('tests', (test) => {
  test.test('doc without centroid should not modify input', (t) => {
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        throw new Error('lookup should not have been called');
      }
    };

    const lookupStream = stream(resolver);

    test_stream(input, lookupStream, (err, actual) => {
      t.deepEqual(actual, input, 'nothing should have changed');
      t.end();
    });

  });

  test.test('country, dependency, macroregion, region, macrocounty, county, locality, ' +
    'localadmin, borough, macrohood, and neighborhood fields should be set into document', (t) => {
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'Country 1', '1', 'XYZ')
        .addParent('dependency', 'Dependency 1', '3', 'Dependency 1 Abbr')
        .addParent('macroregion', 'Macroregion 1', '5', 'Macroregion 1 Abbr')
        .addParent('region', 'Region 1', '7', 'Region 1 Abbr')
        .addParent('macrocounty', 'Macrocounty 1', '9', 'Macrocounty 1 Abbr')
        .addParent('county', 'County 1', '11', 'County 1 Abbr')
        .addParent('locality', 'Locality 1', '13', 'Locality 1 Abbr')
        .addParent('localadmin', 'LocalAdmin 1', '15', 'LocalAdmin 1 Abbr')
        .addParent('borough', 'Borough 1', '17', 'Borough 1 Abbr')
        .addParent('macrohood', 'Macrohood 1', '19', 'Macrohood 1 Abbr')
        .addParent('neighbourhood', 'Neighbourhood 1', '21', 'Neighbourhood 1 Abbr')
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [
            {id: 1, name: 'Country 1', abbr: 'XYZ'},
            {id: 2, name: 'Country 2'}
          ],
          dependency: [
            {id: 3, name: 'Dependency 1', abbr: 'Dependency 1 Abbr'},
            {id: 4, name: 'Dependency 2', abbr: 'Dependency 2 Abbr'}
          ],
          macroregion: [
            {id: 5, name: 'Macroregion 1', abbr: 'Macroregion 1 Abbr'},
            {id: 6, name: 'Macroregion 2', abbr: 'Macroregion 2 Abbr'}
          ],
          region: [
            {id: 7, name: 'Region 1', abbr: 'Region 1 Abbr'},
            {id: 8, name: 'Region 2', abbr: 'Region 2 Abbr'}
          ],
          macrocounty: [
            {id: 9, name: 'Macrocounty 1', abbr: 'Macrocounty 1 Abbr'},
            {id: 10, name: 'Macrocounty 2', abbr: 'Macrocounty 2 Abbr'}
          ],
          county: [
            {id: 11, name: 'County 1', abbr: 'County 1 Abbr'},
            {id: 12, name: 'County 2', abbr: 'County 2 Abbr'}
          ],
          locality: [
            {id: 13, name: 'Locality 1', abbr: 'Locality 1 Abbr'},
            {id: 14, name: 'Locality 2', abbr: 'Locality 2 Abbr'}
          ],
          localadmin: [
            {id: 15, name: 'LocalAdmin 1', abbr: 'LocalAdmin 1 Abbr'},
            {id: 16, name: 'LocalAdmin 2', abbr: 'LocalAdmin 2 Abbr'}
          ],
          borough: [
            {id: 17, name: 'Borough 1', abbr: 'Borough 1 Abbr'},
            {id: 18, name: 'Borough 2', abbr: 'Borough 2 Abbr'},
          ],
          macrohood: [
            {id: 19, name: 'Macrohood 1', abbr: 'Macrohood 1 Abbr'},
            {id: 20, name: 'Macrohood 2', abbr: 'Macrohood 2 Abbr'}
          ],
          neighbourhood: [
            {id: 21, name: 'Neighbourhood 1', abbr: 'Neighbourhood 1 Abbr'},
            {id: 22, name: 'Neighbourhood 2', abbr: 'Neighbourhood 2 Abbr'}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver);

    test_stream(input, lookupStream, (err, actual) => {
      t.deepEqual(actual, expected, 'all fields should have been set');
      t.end();
    });

  });

  test.test('resolver with field-less result should only set fields that are present', (t) => {
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 }),
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('region', 'Region', '1'),
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
        .addParent('country', 'Country', '2')
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        if (_.isEqual(centroid, {lat: 12.121212, lon: 21.212121})) {
          setTimeout(callback, 0, null, {region: [{id: 1, name: 'Region'}]});
        } else if (_.isEqual(centroid, {lat: 13.131313, lon: 31.313131})) {
          setTimeout(callback, 0, null, {country: [{id: 2, name: 'Country'}]});
        }
      }
    };

    const lookupStream = stream(resolver);

    test_stream(input, lookupStream, (err, actual) => {
      t.deepEqual(actual, expected, 'result with missing fields should not set anything in doc');
      t.end();
    });

  });

  test.test('resolver throwing error should push doc onto stream unmodified', (t) => {
    t.plan(3);

    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 }),
      new Document( 'whosonfirst', 'placetype', '2')
        .setCentroid({ lat: 13.131313, lon: 31.313131 }),
      new Document( 'whosonfirst', 'placetype', '3')
        .setCentroid({ lat: 14.141414, lon: 41.414141 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 }),
      new Document( 'whosonfirst', 'placetype', '3')
        .setCentroid({ lat: 14.141414, lon: 41.414141 })
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        // return an error only for the second doc
        if (centroid.lat === 13.131313) {
          setTimeout(callback, 0, 'this is a resolver error');
        } else {
          setTimeout(callback, 0, null, {});
        }
      }
    };

    const errorMessages = [];

    const lookupStream = proxyquire('../src/lookupStream', {
      'pelias-logger': {
        winston: {
          transports: {
            File: function() {

            }
          }
        },
        get: (layer, opts) => {
          return {
            error: (message, additional) => {
              t.equals(message, 'PIP server failed: "this is a resolver error"');
              t.deepEquals(additional, {
                id: 'whosonfirst:placetype:2',
                lat: 13.131313,
                lon: 31.313131
              });
            },
            info: (message) => {},
            debug: (message) => {}
          };
        }
      }

    })(resolver);

    test_stream(input, lookupStream, (err, actual) => {
      t.deepEquals(actual, expected, 'only error-free records should pass through');
      t.end();
    });

  });

  test.test('empty string in place name should not error', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 });

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'Country 1', '1', 'XYZ');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [
            {id: 1, name: 'Country 1', abbr: 'XYZ'}
          ],
          county: [
            {id: 2, name: ''}
          ]
        };

        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver);

    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'county should not be set');
        t.end();
      });
    });

  });

  test.test('call end to stop child processes', (t) => {
    // create a stubbed resolver that implements all required methods
    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        setTimeout(callback, 0, null, []);
      },
      end: function () {
        t.assert(true, 'called end function');
        t.equals(resolver, this, 'this is set to the correct object');
        t.end();
      }
    };
    // create one document to pass through the stream
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 });

    // create the stream to test
    const tested_stream = stream(resolver);

    // consume the stream so that all data is processed
    tested_stream.on('data', function() {});

    // write document to stream
    tested_stream.write(inputDoc, null, function() {});

    // call end to trigger cleanup
    tested_stream.end();
  });
});
