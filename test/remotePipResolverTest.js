'use strict';

const tape = require('tape');
const nock = require('nock');

const remotePipResolver = require('../src/remotePipResolver');

// helper var for enumberating all the layer parameters sent in all queries
const layers = [ 'neighbourhood', 'postalcode', 'borough', 'locality', 'localadmin', 'county',
                        'macrocounty', 'region', 'macroregion', 'dependency', 'country' ];

tape('tests', (test) => {

  test.test('proxying results from remote pip service', (t) => {
    t.plan(1);

    const expected_response = {
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

    const scope = nock('http://example.com')
      .get(`/21.212121/12.121212`)
      .query({ layers: layers })
      .reply(200, expected_response );

    // the callback used to process the response from the PiP service
    const lookupCallback = function(err, result) {

      t.deepEquals(result, expected_response);
      scope.done();
      t.end();

    };

    const resolver = remotePipResolver({ url: 'http://example.com' });

    resolver.lookup({ lat: 12.121212, lon: 21.212121}, [], lookupCallback);

  });

  test.test('proxying error from remote pip service', (t) => {
    t.plan(1);

    const scope = nock('http://example.com')
      .get('/undefined/undefined')
      .query({ layers: layers })
      .reply(400, 'Cannot parse input');

    // the callback used to process the response from the PiP service
    const lookupCallback = function(err, result) {
      t.equals(err, `http://example.com/undefined/undefined?layers=${layers} returned status 400: Cannot parse input`);
      scope.done();
      t.end();

    };

    const resolver = remotePipResolver({ url: 'http://example.com'});

    resolver.lookup({}, [], lookupCallback);

  });

});
