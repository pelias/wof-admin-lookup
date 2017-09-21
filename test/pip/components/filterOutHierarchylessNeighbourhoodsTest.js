const tape = require('tape');
const event_stream = require('event-stream');
const async = require('async');
const proxyquire = require('proxyquire').noCallThru();

const filterOutHierarchylessNeighbourhoods = require('../../../src/pip/components/filterOutHierarchylessNeighbourhoods');

function test_stream(input, testedStream, callback) {
    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('non-neighbourhoods tests', test => {
  const non_neighbourhoods = [
    'borough',
    'locality',
    'localadmin',
    'county',
    'macrocounty',
    'macroregion',
    'region',
    'dependency',
    'country',
    'continent',
    'marinearea',
    'ocean'
  ];

	test.test('placetype != neighbourhood should return true even with empty wof:hierarchy', t => {
    async.each(non_neighbourhoods, (placetype, done) => {
      const input = [
        {
          properties: {
            'wof:id': 17,
            'wof:placetype': placetype,
            'wof:hierarchy': []
          }
        }
  		];

      const filter = filterOutHierarchylessNeighbourhoods.create();

  		test_stream(input, filter, (err, actual) => {
        t.deepEquals(actual, input, 'should have returned true');
        done();
      });

    }, err => {
      t.end();
    });

	});

  test.test('placetype != neighbourhood should return true even with undefined wof:hierarchy', t => {
    async.each(non_neighbourhoods, (placetype, done) => {
      const input = [
        {
          properties: {
            'wof:id': 17,
            'wof:placetype': placetype,
            'wof:hierarchy': undefined
          }
        }
  		];

      const filter = filterOutHierarchylessNeighbourhoods.create();

  		test_stream(input, filter, (err, actual) => {
        t.deepEquals(actual, input, 'should have returned true');
        done();
      });

    }, err => {
      t.end();
    });

	});

});

tape('neighbourhood tests', test => {
  test.test('placetype=neighbourhood and empty wof:hierarchy should return false', t => {
    const logger = require('pelias-mock-logger')();

    const input = [
      {
        properties: {
          'wof:id': 17,
          'wof:placetype': 'neighbourhood',
          'wof:hierarchy': []
        }
      }
		];

    const filter = proxyquire('../../../src/pip/components/filterOutHierarchylessNeighbourhoods', {
      'pelias-logger': logger
    }).create();

    test_stream(input, filter, (err, actual) => {
      t.deepEquals(actual, [], 'should have returned true');
      t.ok(logger.isDebugMessage('skipping 17: neighbourhood with empty hierarchy'));
      t.end();
    });

  });

  test.test('placetype=neighbourhood and undefined wof:hierarchy should return false', t => {
    const logger = require('pelias-mock-logger')();

    const input = [
      {
        properties: {
          'wof:id': 17,
          'wof:placetype': 'neighbourhood',
          'wof:hierarchy': undefined
        }
      }
		];

    const filter = proxyquire('../../../src/pip/components/filterOutHierarchylessNeighbourhoods', {
      'pelias-logger': logger
    }).create();

    test_stream(input, filter, (err, actual) => {
      t.deepEquals(actual, [], 'should have returned true');
      t.ok(logger.isDebugMessage('skipping 17: neighbourhood with empty hierarchy'));
      t.end();
    });

  });

  test.test('placetype=neighbourhood and non-empty wof:hierarchy should return true', t => {
    const input = [
      {
        properties: {
          'wof:id': 17,
          'wof:placetype': 'neighbourhood',
          'wof:hierarchy': [ [] ]
        }
      }
		];

    const filter = filterOutHierarchylessNeighbourhoods.create();

		test_stream(input, filter, (err, actual) => {
      t.deepEquals(actual, input, 'should have returned true');
      t.end();
    });

  });

});
