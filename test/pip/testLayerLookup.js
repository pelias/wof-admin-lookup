'use strict';

const config = require('pelias-config').generate();

const fs = require('fs');
const path = require( 'path' );

const async = require('async');
const deep = require( 'deep-diff' );

const createPIPService = require('../../src/pip/index').create;

/*
 * Only run some layers to speed up the tests
 */
const layers = [
  //'continent',
  'country', // 216
  //'county', // 18166
  'dependency', // 39
  //'localadmin', // 106880
  //'locality', // 160372
  'macrocounty', // 350
  'macroregion', // 82
  //'neighbourhood', // 62936
  'region' // 4698
];

function test(callback) {
  createPIPService(config.imports.whosonfirst.datapath, layers, false, (err, pipService) => {
    const basePath = path.resolve(__dirname);
    const inputDataPath = path.join(basePath, 'data', 'layerTestData.json');
    const inputData = require( inputDataPath );
    const results = [];
    const expectedPath = path.join(basePath, 'data', 'expectedLayerTestResults.json');

    async.forEach(inputData, (location, done) => {
        pipService.lookup(location.latitude, location.longitude, location.layers, (err, result) => {
          results.push(result);
          done();
        });
      },
      () => {
        const expected = JSON.parse(fs.readFileSync(expectedPath));

        sortResults(expected);
        sortResults(results);

        // uncomment this to write the actual results to the expected file
        // make sure they look ok though. semicolon left off so jshint reminds you
        // not to commit this line
        // fs.writeFileSync(expectedPath, JSON.stringify(results, null, 2))

        const diff = deep(expected, results);

        pipService.end();

        if (diff) {
          console.log('expected and actual output are different');
          console.log(diff);
        }
        else {
          console.log('expected and actual output are the same');
        }
        callback();
      });
  });
}

/**
 * Sort result arrays which look like this
 *
 * [ [{Id:1}, {Id:2}, {Id:3}], [{Id:5}, {Id:6], [{Id:7}, {Id:8}, {Id:9}] ]
 */
function sortResults(results) {
  // sort the individual result arrays
  results.forEach((a) => {
    a.sort((a, b) => {
      return b.Id - a.Id;
    });
  });

  results.sort((a, b) => {
    return b[0].Id - a[0].Id;
  });

  return results;
}

test((err) => {
  process.exit(err);
});
