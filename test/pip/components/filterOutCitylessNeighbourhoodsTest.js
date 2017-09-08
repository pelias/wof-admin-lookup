const tape = require('tape');
const event_stream = require('event-stream');
const async = require('async');
const proxyquire = require('proxyquire').noCallThru();

const filterOutCitylessNeighbourhoods = require('../../../src/pip/components/filterOutCitylessNeighbourhoods');

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
            'wof:hierarchy': [{}]
          }
        }
  		];

      const filter = filterOutCitylessNeighbourhoods.create();

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
  test.test('placetype=neighbourhood and no locality_id or localadmin_id in wof:hierarchy should return false', t => {
    const logger = require('pelias-mock-logger')();

    const input = [
      {
        properties: {
          'wof:id': 17,
          'wof:placetype': 'neighbourhood',
          'wof:hierarchy': [
            {
              neighbourhood_id: 17,
              county_id: 17,
              macrocounty_id: 17,
              region_id: 17,
              macroregion_id: 17,
              dependency_id: 17,
              country_id: 17,
              continent_id: 17
            }
          ]
        }
      }
		];

    const filter = proxyquire('../../../src/pip/components/filterOutCitylessNeighbourhoods', {
      'pelias-logger': logger
    }).create();

    test_stream(input, filter, (err, actual) => {
      t.deepEquals(actual, [], 'should have returned false');
      t.ok(logger.isDebugMessage('skipping 17: neighbourhood without locality or localadmin'));
      t.end();
    });

  });

  test.test('placetype=neighbourhood and locality_id in wof:hierarchy should return true', t => {
    const input = [
      {
        properties: {
          'wof:id': 17,
          'wof:placetype': 'neighbourhood',
          'wof:hierarchy': [
            {
              locality_id: 17
            }
          ]
        }
      }
		];

    const filter = filterOutCitylessNeighbourhoods.create();

		test_stream(input, filter, (err, actual) => {
      t.deepEquals(actual, input, 'should have returned true');
      t.end();
    });

  });

  test.test('placetype=neighbourhood and localadmin_id in wof:hierarchy should return true', t => {
    const input = [
      {
        properties: {
          'wof:id': 17,
          'wof:placetype': 'neighbourhood',
          'wof:hierarchy': [
            {
              localadmin_id: 17
            }
          ]
        }
      }
		];

    const filter = filterOutCitylessNeighbourhoods.create();

		test_stream(input, filter, (err, actual) => {
      t.deepEquals(actual, input, 'should have returned true');
      t.end();
    });

  });

});
