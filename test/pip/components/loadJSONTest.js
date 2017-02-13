const tape = require('tape');
const event_stream = require('event-stream');
const path = require('path');
const fs = require('fs');
const temp = require('temp').track();
const proxyquire = require('proxyquire').noCallThru();

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
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
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync([temp_dir, 'data'].join(path.sep));

      const loadJSON = proxyquire('../../../src/pip/components/loadJSON', {
        // mock out pelias-logger to verify error logging event and clean up test output
        'pelias-logger': {
          get: (layer) => {
            t.equals(layer, 'wof-pip-service:loadJSON');
            return {
              error: (message) => {
                t.ok(message.match(/^exception occured parsing.*?datafile.geojson.*$/));
              }
            };

          }
        }

      }).create(temp_dir);

      // write the contents to a file
      const filename = [temp_dir, 'data', 'datafile.geojson'].join(path.sep);
      fs.writeFileSync(filename, 'this is not json\n');

      const inputRecord = { path: path.basename(filename) };

      test_stream([inputRecord], loadJSON, (err, actual) => {
        temp.cleanupSync();
        t.deepEqual(actual, [], 'nothing should have been passed along');
        t.end();
      });

    });

  });

});
