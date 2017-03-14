'use strict';

const tape = require('tape');
const event_stream = require('event-stream');
const path = require('path');
const fs = require('fs');
const temp = require('temp').track();
const proxyquire = require('proxyquire').noCallThru();
const intercept = require('intercept-stdout');

function test_stream(input, testedStream, callback, error_callback) {
    if (!error_callback) {
      error_callback = function() {};
    }

    if (!callback) {
      callback = function() {};
    }

    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).on('error', error_callback)
    .pipe(destination_stream);
}

tape('loadJSON tests', (test) => {
  test.test('json should be loaded from file', (t) => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync([temp_dir, 'data'].join(path.sep));

      // write the contents to a file
      const filename = [temp_dir, 'data', 'datafile.geojson'].join(path.sep);
      const fileContents = { a: 1, b: 2 };
      fs.writeFileSync(filename, JSON.stringify(fileContents) + '\n');

      const loadJSON = require('../../../src/pip/components/loadJSON').create(temp_dir);

      const inputRecord = { path: path.basename(filename) };

      test_stream([inputRecord], loadJSON, (err, actual) => {
        temp.cleanupSync();
        t.deepEqual(actual, [fileContents], 'should be equal');
        t.end();
      });

    });

  });

  test.test('invalid JSON should log an error and not pass along anything', (t) => {
    let stderr = '';

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync([temp_dir, 'data'].join(path.sep));

      const loadJSON = require('../../../src/pip/components/loadJSON').create(temp_dir);

      // intercept/swallow stderr
      var unhook_intercept = intercept(
        function() { },
        function(txt) { stderr += txt; return ''; }
      );

      // write the contents to a file
      const filename = [temp_dir, 'data', 'datafile.geojson'].join(path.sep);
      fs.writeFileSync(filename, 'this is not json\n');

      const input = {
        path: path.basename(filename)
      };

      test_stream([input], loadJSON, undefined, (err, actual) => {
        unhook_intercept();
        temp.cleanupSync();
        t.deepEqual(actual, undefined, 'an error should be thrown');
        t.ok(stderr.match(/SyntaxError: Unexpected token h/), 'error output present');
        t.end();
      });

    });

  });

});
