'use strict';

const config = require('pelias-config').generate();

const createPIPService = require('../../src/pip/index').create;
const fs = require('fs');
const async = require('async');
const _ = require('lodash');

let inputData = require('./testData.json');

const layers = [
  //'continent',
  'country', // 216
  'county', // 18166
  'dependency', // 39
  'localadmin', // 106880
  'locality', // 160372
  'macrocounty', // 350
  'macroregion', // 82
  'neighbourhood', // 62936
  'region' // 4698
];

function test(callback) {
  let startTime = process.hrtime();

  createPIPService(config.imports.whosonfirst.datapath, layers, false, (err, pipService) => {

    console.log(`Total load time (minutes) = ${(getMicroSeconds(process.hrtime(startTime))/1000000/60)}`);

    inputData = _.concat(inputData, _.clone(inputData));
    inputData = _.concat(inputData, _.clone(inputData));
    inputData = _.concat(inputData, _.clone(inputData));

    startTime = process.hrtime();

    async.forEach(inputData, (location, done) => {
      pipService.lookup(location.latitude, location.longitude, layers, (err, results) => {
        location.results = results;
        done();
      });
    },
    () => {
      const reqDuration = getMicroSeconds(process.hrtime(startTime)) / inputData.length;
      console.log(`Query count = ${inputData.length}`);
      console.log(`Average duration (μsec) = ${reqDuration}`);
      console.log(`Computed req/sec = ${1000000 / reqDuration}`);

      fs.writeFileSync('./actualTestResults.json', JSON.stringify(inputData, null, 2));

      pipService.end();

      callback();
    });

  });
}

function getMicroSeconds(time) {
  return (time[0] * 1e9 + time[1]) / 1000;
}

test((err) => {
  process.exit(err);
});
