const tape = require('tape');
const event_stream = require('event-stream');
const Document = require('pelias-model').Document;
const _ = require('lodash');

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

  test.test('country, macroregion, region, macrocounty, county, locality, ' +
    'localadmin, borough, and neighborhood fields should be set into document', (t) => {
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAlpha3('XYZ')
        .addParent('country', 'Country 1', '1', 'XYZ')
        .addParent('macroregion', 'Macroregion 1', '3')
        .addParent('region', 'Region 1', '5', 'Region 1 Abbr')
        .addParent('macrocounty', 'Macrocounty 1', '7')
        .addParent('county', 'County 1', '9')
        .addParent('locality', 'Locality 1', '11')
        .addParent('localadmin', 'LocalAdmin 1', '13')
        .addParent('borough', 'Borough 1', '15')
        .addParent('neighbourhood', 'Neighbourhood 1', '17')
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [
            {id: 1, name: 'Country 1', abbr: 'XYZ'},
            {id: 2, name: 'Country 2'}
          ],
          macroregion: [
            {id: 3, name: 'Macroregion 1'},
            {id: 4, name: 'Macroregion 2'}
          ],
          region: [
            {id: 5, name: 'Region 1', abbr: 'Region 1 Abbr'},
            {id: 6, name: 'Region 2', abbr: 'Region 2 Abbr'}
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
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        setTimeout(callback, 0, 'this is an error', {region: 'Region'});
      }
    };

    const lookupStream = stream(resolver);

    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(() => {
      t.fail('this stream should not have been called');
      t.end();
    });

    input_stream.pipe(lookupStream).on('error', (e) => {
      t.equal(e.message, 'PIP server failed: "this is an error"');
      t.deepEqual(input, expected, 'the document should not have been modified');
      t.end();
    }).pipe(destination_stream);

  });

  test.test('empty string in place name should not error', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 });

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setAlpha3('XYZ')
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

  test.test('first dependency should be used as region when there are no regions', (t) => {
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('region', 'Dependency 1', '11', 'Dependency 1 Abbr')
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          dependency: [
            {id: 11, name: 'Dependency 1', abbr: 'Dependency 1 Abbr'},
            {id: 12, name: 'Dependency 2', abbr: 'Dependency 2 Abbr'}
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

  test.test('region should be set to first region when regions and dependencies are both available', (t) => {
    const input = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    const expected = [
      new Document( 'whosonfirst', 'placetype', '1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('region', 'Region 1', '11')
    ];

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
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

    const lookupStream = stream(resolver);

    test_stream(input, lookupStream, (err, actual) => {
      t.deepEqual(actual, expected, 'all fields should have been set');
      t.end();
    });

  });

  test.test('call end to stop child processes', (t) => {
    const resolver = {
      end: function () {
        t.assert(true, 'called end function');
        t.equals(resolver, this, 'this is set to the correct object');
        t.end();
      }
    };

    stream(resolver).end();

  });

});
