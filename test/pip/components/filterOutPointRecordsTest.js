var tape = require('tape');
const test_stream = require('../../index').test_stream;

var filterOutPointRecords = require('../../../src/pip/components/filterOutPointRecords');

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
