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

    const lookupStream = stream(resolver);
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

    const lookupStream = stream(resolver);
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

    const lookupStream = stream(resolver);
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

    const lookupStream = stream(resolver);
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

    const lookupStream = stream(resolver);
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

});
