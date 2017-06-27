var tape = require('tape');
var event_stream = require('event-stream');

var filterOutPointRecords = require('../../../src/pip/components/filterOutPointRecords');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('filterOutPointNotPolygon', function (test){
	test.test('record without geometry.type should return false', function(t) {
		var input = [
      { geometry: { } },
      { geometry: {'coordinates':[[[-180.0,-90.0],[-180.0,90.0]]]} }
		];

		var expected = [];
		var filter = filterOutPointRecords.create();

		test_stream(input, filter, function(err, actual) {
     			 t.deepEqual(actual, expected, 'should have returned true');
     			 t.end();
   		 });
	});

  test.test('point record should return false', function(t) {
		var input = {
			geometry: {'type':'Point'}
		};

		var expected = [];
		var filter = filterOutPointRecords.create();

		test_stream([input], filter, function(err, actual) {
     			 t.deepEqual(actual, expected, 'should have returned true');
     			 t.end();
   		 });
	});

  test.test('polygon record should return true', function(t) {
		var input = {
			geometry: {'type':'Polygon'}
		};

		var expected = [input];
		var filter = filterOutPointRecords.create();

		test_stream([input], filter, function(err, actual) {
     			 t.deepEqual(actual, expected, 'should have returned true');
     			 t.end();
   		 });
	});

  test.test('MultiPolygon record should return true', function(t) {
		var input = {
			geometry: {'type':'MultiPolygon'}
		};

		var expected = [input];
		var filter = filterOutPointRecords.create();

		test_stream([input], filter, function(err, actual) {
     			 t.deepEqual(actual, expected, 'should have returned true');
     			 t.end();
   		 });
	});

});
