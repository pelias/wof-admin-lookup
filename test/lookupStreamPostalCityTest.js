const tape = require('tape');
const event_stream = require('event-stream');
const Document = require('pelias-model').Document;

const stream = require('../src/lookupStream');

function test_stream(input, testedStream, callback) {
    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('tests', (test) => {
  test.test('postal cities - USA lookup - ZIP 18964', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '18964');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Souderton', '101717367', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '18964');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 21236', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '21236');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Nottingham', '1125996559', undefined)
      .addParent( 'locality', 'Baltimore', '85949461', undefined)
      .addParent( 'locality', 'White Marsh', '85950229', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '21236');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 17033', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '17033');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Hershey', '101719813', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '17033');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 17036', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '17036');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Hummelstown', '101717689', undefined)
      .addParent( 'locality', 'Hershey', '101719813', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '17036');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 95616 - no PIP locality', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '95616');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Davis', '85922419', undefined)
      .setAddress('zip', '95616');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 94610 - including state prefix and ZIP+4', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', 'CA 94610-2737');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Piedmont', '85921877', undefined)
      .addParent( 'locality', 'Oakland', '85921881', undefined)
      .setAddress('zip', 'CA 94610-2737');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - AUS lookup - postcode 2617', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '2617');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'Australia', '1', 'AUS')
      .addParent( 'locality', 'Bruce', '101938721', undefined)
      .addParent( 'locality', 'Belconnen', '101938713', undefined)
      .addParent( 'locality', 'Evatt', '101938763', undefined)
      .addParent( 'locality', 'Giralang', '101938789', undefined)
      .setAddress('zip', '2617');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'Australia', abbr: 'AUS'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - AUS lookup - postcode 2612', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '2612');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'Australia', '1', 'AUS')
      .addParent( 'locality', 'Campbell', '101938727', undefined)
      .addParent( 'locality', 'Braddon', '101938719', undefined)
      .addParent( 'locality', 'Canberra', '1141909401', undefined)
      .addParent( 'locality', 'Turner', '101938909', undefined)
      .setAddress('zip', '2612');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'Australia', abbr: 'AUS'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

});
