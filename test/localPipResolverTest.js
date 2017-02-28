'use strict';

const tape = require('tape');
const proxyquire = require('proxyquire').noCallThru();

tape('tests', (test) => {
  test.test('and end() should be called', (t) => {
    let end_was_called = false;

    // capture the info-level messages logged
    const info_messages = [];

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
            Abbrev: 'country abbreviation 1'
          },
          {
            Id: 'country id 2',
            Name: 'country name 2',
            Placetype: 'country',
            Abbrev: 'country abbreviation 2'
          },
          {
            Id: 'region id 1',
            Name: 'region name 1',
            Placetype: 'region',
            Abbrev: 'region abbreviation 1'
          }
        ];

        callback(null, results);
      },
      end: () => {
        end_was_called = true;
      }
    };

    const resolver = proxyquire('../src/localPipResolver', {
      './pip/index': {
        create: (datapath, layers, localizedAdminNames, callback) => {
          t.equals(datapath, 'this is the datapath');
          t.deepEqual(layers, []);
          t.equals(localizedAdminNames, false);

          callback(null, service);

        }
      },
      'pelias-logger': {
        get: (log_module) => {
          t.equals(log_module, 'wof-admin-lookup');

          return {
            info: (message) => {
              info_messages.push(message);
            }
          };
        }
      }

    })('this is the datapath');

    // the callback used to process the response from the PiP service
    const lookupCallback = function(err, result) {
      const expected = {
        country: [
          {id: 'country id 1', name: 'country name 1', abbr: 'country abbreviation 1'},
          {id: 'country id 2', name: 'country name 2', abbr: 'country abbreviation 2'}
        ],
        region: [
          {id: 'region id 1', name: 'region name 1', abbr: 'region abbreviation 1'}
        ]
      };

      t.deepEquals(result, expected);

    };

    resolver.lookup({ lat: 12.121212, lon: 21.212121}, ['layer 1', 'layer 2'], lookupCallback);
    resolver.end();

    t.deepEquals(info_messages, ['Shutting down admin lookup service']);
    t.ok(end_was_called);
    t.end();

  });

});
