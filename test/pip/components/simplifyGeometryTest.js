var tape = require('tape');
const stream_mock = require('stream-mock');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('simplifyGeometry tests', function(test) {
  test.test('Polygon geometry type should simplify first coordinates', function(t) {
    var input = {
      properties: {
        Id: 17
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-76.42953199999999,40.23899],
            [-76.429484,40.238996]
          ]
        ]
      }
    };

    var expected = {
      properties: {
        Id: 17
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-76.429532, 40.23899],
            [-76.429484, 40.238996]
          ]
        ]
      }
    };

    var extractFields = require('../../../src/pip/components/simplifyGeometry').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('MultiPolygon geometry type should simplify all coordinates', function(t) {
    var input = {
      properties: {
        Id: 17
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-76.42953199999999,40.23899],
            [-76.429484,40.238996]
          ],
          [
            [-76.40843700000001,40.241821],
            [-76.407544,40.241928]
          ]
        ]

      }
    };

    var expected = {
      properties: {
        Id: 17
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-76.429532, 40.23899],
            [-76.429484, 40.238996]
          ],
          [
            [-76.408437,40.241821],
            [-76.407544,40.241928]
          ]
        ]
      }
    };

    var extractFields = require('../../../src/pip/components/simplifyGeometry').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

});
