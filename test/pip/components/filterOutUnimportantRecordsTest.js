var tape = require('tape');
var event_stream = require('event-stream');

var filterOutUnimportantNeighbourhoods = require('../../../src/pip/components/filterOutUnimportantRecords');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('filterOutUnimportantNeighbourhoods', function(test) {
  test.test('record without mz:hierarchy_label should return false', function(t) {
    var input = {
      properties: { }
    };

    var expected = [];

    var filter = filterOutUnimportantNeighbourhoods.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('record with non-integer mz:hierarchy_label should return false', function(t) {
    var input = [
      { properties: { 'mz:hierarchy_label': '1' } },
      { properties: { 'mz:hierarchy_label': 'this is not an integer' } },
    ];

    var expected = [];

    var filter = filterOutUnimportantNeighbourhoods.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('record with mz:hierarchy_label 0 value should return false', function(t) {
    var input = {
      properties: {
        'mz:hierarchy_label': 0
      }
    };

    var expected = [];

    var filter = filterOutUnimportantNeighbourhoods.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('record with mz:hierarchy_label 1 value should return true', function(t) {
    var input = {
      properties: {
        'mz:hierarchy_label': 1
      }
    };

    var expected = [input];

    var filter = filterOutUnimportantNeighbourhoods.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

});
