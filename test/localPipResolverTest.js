'use strict';

const tape = require('tape');
const proxyquire = require('proxyquire').noCallThru();

tape('tests', (test) => {
  test.test('and end() should be called', (t) => {
    let end_was_called = false;

    // this is the mock PiP service that gets called
    const service = {
      lookup: (lat, lon, layers, callback) => {
        t.equal(lat, 12.121212);
        t.equal(lon, 21.212121);
        t.deepEquals(layers, ['layer 1', 'layer 2']);

        // the response from the PiP service
        const results = [
          {
            Id: 'country id 1',
            Name: 'country name 1',
            Placetype: 'country',
            Abbrev: 'country abbreviation 1',
            Centroid: {
              lat: 12.121212,
              lon: 21.212121
            },
            BoundingBox: 'country boundingbox 1'
          },
          {
            Id: 'country id 2',
            Name: 'country name 2',
            Placetype: 'country'
          },
          {
            Id: 'region id 1',
            Name: 'region name 1',
            Placetype: 'region',
            Abbrev: 'region abbreviation 1',
            Centroid: {
              lat: 13.131313,
              lon: 31.313131
            },
            BoundingBox: 'region boundingbox 1'
          }
        ];

        callback(null, results);
      },
      end: () => {
        end_was_called = true;
      }
    };

    const logger = require('pelias-mock-logger')();

    const resolver = proxyquire('../src/localPipResolver', {
      './pip/index': {
        create: (datapath, layers, localizedAdminNames, callback) => {
          t.equals(datapath, 'this is the datapath');
          t.deepEqual(layers, []);
          t.equals(localizedAdminNames, false);

          callback(null, service);

        }
      },
      'pelias-logger': logger
    })('this is the datapath');

    // the callback used to process the response from the PiP service
    const lookupCallback = function(err, result) {
      const expected = {
        country: [
          {
            id: 'country id 1',
            name: 'country name 1',
            abbr: 'country abbreviation 1',
            centroid: {
              lat: 12.121212,
              lon: 21.212121
            },
            bounding_box: 'country boundingbox 1'
          },
          {
            id: 'country id 2',
            name: 'country name 2'
          }
        ],
        region: [
          {
            id: 'region id 1',
            name: 'region name 1',
            abbr: 'region abbreviation 1',
            centroid: {
              lat: 13.131313,
              lon: 31.313131
            },
            bounding_box: 'region boundingbox 1'
          }
        ]
      };

      t.deepEquals(result, expected);

    };

    resolver.lookup({ lat: 12.121212, lon: 21.212121}, ['layer 1', 'layer 2'], lookupCallback);
    resolver.end();

    t.deepEquals(logger.getInfoMessages(), ['Shutting down admin lookup service']);
    t.ok(end_was_called);
    t.end();

  });

  test.test('layers should be passed when supplied', (t) => {
    t.plan(3);

    const resolver = proxyquire('../src/localPipResolver', {
      './pip/index': {
        create: (datapath, layers, localizedAdminNames, callback) => {
          t.equals(datapath, 'this is the datapath');
          t.deepEqual(layers, ['layer 1', 'layer 2']);
          t.equals(localizedAdminNames, false);
          t.end();

        }
      }
    })('this is the datapath', ['layer 1', 'layer 2']);

  });

  test.test('createPipService returning error should throw exception', t => {
    const resolver = proxyquire('../src/localPipResolver', {
      './pip/index': {
        create: (datapath, layers, localizedAdminNames, callback) => {
          callback('this is a localPipResolver error');
        }
      }
    });

    t.throws(resolver.bind('this is the datapath', ['layer 1', 'layer 2']), /this is a localPipResolver error/);
    t.end();

  });

});
