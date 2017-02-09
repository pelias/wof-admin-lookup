'use strict';

const tape = require('tape');
const event_stream = require('event-stream');
const proxyquire = require('proxyquire').noCallThru();
const through = require('through2');

const stream = require('../src/lookupStream');

function test_stream(input, testedStream, callback) {
    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('tests for main entry point', (test) => {
  test.test('config.generate(schema) throwing error should rethrow', (t) => {
    t.throws(() => {
      proxyquire('../index', {
        // verify the schema
        './schema': 'this is the schema',
        'pelias-config': {
          generate: (schema) => {
            t.equals(schema, 'this is the schema');
            throw Error('config is not valid');
          }
        }
      });

    }, /config is not valid/);

    t.end();

  });

  test.test('adminLookup enabled scenarios should return a lookupStream', (t) => {
    const config_import_scenarios = [
      { imports: { adminLookup: {} } },
      { imports: { adminLookup: { enabled: true } } }
    ];

    config_import_scenarios.forEach((scenario) => {
      const stream = proxyquire('../index', {
        // verify the schema
        './schema': 'this is the schema',
        'pelias-config': {
          generate: (schema) => {
            t.equals(schema, 'this is the schema');

            scenario.imports.adminLookup.maxConcurrentReqs = 17;
            scenario.imports.whosonfirst = {
              datapath: 'this is the wof datapath'
            };

            return scenario;

          }
        },
        './src/localPipResolver': (datapath) => {
          t.equals(datapath, 'this is the wof datapath');
          return 'this is the resolver';
        },
        './src/lookupStream': (resolver, maxConcurrentReqs) => {
          t.equals(resolver, 'this is the resolver');
          t.equals(maxConcurrentReqs, 17, 'maxConcurrentReqs should be from config');

          return through.obj(function(record, enc, next) {
            record.field2 = 'value 2';
            next(null, record);
          });

        }

      }).createLookupStream();

      const input = [
        { field1: 'value 1' }
      ];

      const expected = [
        { field1: 'value 1', field2: 'value 2' }
      ];

      test_stream(input, stream, (err, actual) => {
        t.deepEqual(actual, expected, 'something should have changed');
      });

    });

    t.end();

  });

  test.test('maxConcurrentReqs should default to # cpus * 10 when not specified', (t) => {
    const stream = proxyquire('../index', {
      './schema': 'this is the schema',
      'pelias-config': {
        // the mock config
        generate: (schema) => {
          // verify the schema
          t.equals(schema, 'this is the schema');

          return {
            imports: {
              adminLookup: {
                enabled: true
              },
              whosonfirst: {
                datapath: 'this is the wof datapath'
              }
            }
          };

        }
      },
      './src/localPipResolver': (datapath) => {
        // mock out the resolver
        t.equals(datapath, 'this is the wof datapath');
        return 'this is the resolver';
      },
      './src/lookupStream': (resolver, maxConcurrentReqs) => {
        // verify what was passed to the stream constructor, returns a stream that modifies
        t.equals(resolver, 'this is the resolver');
        t.equals(maxConcurrentReqs, 70, 'maxConcurrentReqs should be # cpus * 10');

        return through.obj(function(record, enc, next) {
          record.field2 = 'value 2';
          next(null, record);
        });

      },
      'os': {
        // determines default for maxConcurrentReqs
        cpus: () => {
          return new Array(7);
        }
      }

    }).createLookupStream();

    const input = [
      { field1: 'value 1' }
    ];

    const expected = [
      { field1: 'value 1', field2: 'value 2' }
    ];

    test_stream(input, stream, (err, actual) => {
      t.deepEqual(actual, expected, 'something should have changed');
      t.end();
    });

  });

  test.test('adminLookup.enabled = false should return a pass-through stream', (t) => {
    const stream = proxyquire('../index', {
      './schema': 'this is the schema',
      // the mock config
      'pelias-config': {
        generate: (schema) => {
          // verify the schema
          t.equals(schema, 'this is the schema');

          return {
            imports: {
              adminLookup: {
                enabled: false
              }
            }
          };

        }
      },
      './src/localPipResolver': (datapath) => {
        throw Error('localPipResolver should not have been called');
      },
      './src/lookupStream': (resolver, maxConcurrentReqs) => {
        throw Error('lookupStream should not have been called');
      },

    }).createLookupStream();

    const input = [
      { field1: 'value 1'}
    ];

    test_stream(input, stream, (err, actual) => {
      t.deepEqual(actual, input, 'nothing should have changed');
      t.end();
    });

  });

});
