const tape = require('tape');
const event_stream = require('event-stream');

const bufferPointRecords = require('../../../src/pip/components/bufferPointRecords');
const ukProps = { 'iso:country': 'GB', 'hierarchy': [{ country_id: 85633159 }] };
const usaProps = { 'iso:country': 'US', 'hierarchy': [{ country_id: 85633793 }] };

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('isInUK', function (test){
  test.test('test to see if record is within the United Kingdom', function(t) {

    var isInUK = bufferPointRecords.isInUK;

    t.false(isInUK({}));

    t.false(isInUK({'properties': null}));
    t.false(isInUK({'properties': ''}));
    t.false(isInUK({'properties': []}));
    t.false(isInUK({'properties': {}}));
    t.false(isInUK({'wof:hierarchy': null}));
    t.false(isInUK({'wof:hierarchy': ''}));
    t.false(isInUK({'wof:hierarchy': []}));
    t.false(isInUK({'wof:hierarchy': {}}));

    t.false(isInUK({'properties': {'iso:country': null}}));
    t.false(isInUK({'properties': {'iso:country': ''}}));
    t.false(isInUK({'properties': {'iso:country': {}}}));
    t.false(isInUK({'properties': {'iso:country': 'US'}}));
    t.true(isInUK({'properties': {'iso:country': 'GB'}}));
    t.true(isInUK({'properties': {'iso:country': ' GB '}}));
    t.true(isInUK({'properties': {'iso:country': ' gb '}}));

    t.false(isInUK({'properties': {'iso:country': 'US', 'wof:hierarchy': [{ country_id: 85633159 }]}}));
    t.true(isInUK({'properties': {'wof:hierarchy': [{}, { country_id: 85633159 }]}}));
    t.true(isInUK({'properties': {'wof:hierarchy': [{}, { country_id: '85633159' }]}}));

    t.true(isInUK({'properties': ukProps}));
    t.false(isInUK({'properties': usaProps}));
    t.end();
  });
});


tape('non-point types should be a no-op', function (test){
  test.test('geometry.type is null', function(t) {
    var input = [
      { geometry: { } },
      { geometry: {'coordinates':[[[-180.0,-90.0],[-180.0,90.0]]]} },
      { geometry: {'type': 'LineString', 'coordinates':[[-180.0,-90.0],[-180.0,90.0]]} },
      { geometry: {'type': 'Polygon', 'coordinates':[[[-180.0,-90.0],[-180.0,90.0]]]} },
      { geometry: {'type': 'MultiPolygon', 'coordinates':[[[[-180.0,-90.0],[-180.0,90.0]]]]} }
    ];

    var filter = bufferPointRecords.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, input);
      t.end();
     });
  });
});

tape('non-uk records should be a no-op', function (test){
  test.test('record is not within the United Kingdom', function(t) {

    var input = [
      { geometry: {'type': 'Point', 'coordinates':[-180.0,-90.0]} },
      { geometry: {'type': 'Point', 'coordinates':[-180.0,-90.0]}, properties: usaProps },
      { geometry: {'type': 'LineString', 'coordinates':[[-180.0,-90.0],[-180.0,90.0]]}, properties: usaProps },
      { geometry: {'type': 'Polygon', 'coordinates':[[[-180.0,-90.0],[-180.0,90.0]]]}, properties: usaProps },
      { geometry: {'type': 'MultiPolygon', 'coordinates':[[[[-180.0,-90.0],[-180.0,90.0]]]]}, properties: usaProps }
    ];

    var filter = bufferPointRecords.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, input);
      t.end();
     });
  });
});

tape('non-point type uk records should be a no-op', function (test){
  test.test('record is not within the United Kingdom', function(t) {

    var input = [
      { geometry: {'type': 'LineString', 'coordinates':[[-180.0,-90.0],[-180.0,90.0]]}, properties: ukProps },
      { geometry: {'type': 'Polygon', 'coordinates':[[[-180.0,-90.0],[-180.0,90.0]]]}, properties: ukProps },
      { geometry: {'type': 'MultiPolygon', 'coordinates':[[[[-180.0,-90.0],[-180.0,90.0]]]]}, properties: ukProps }
    ];

    var filter = bufferPointRecords.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, input);
      t.end();
     });
  });
});

tape('buffer selected point geometries', function (test){
  test.test('default radius', function(t) {

    var input = [
      { geometry: {'type': 'Point', 'coordinates':[1.0, 1.0]}, properties: ukProps }
    ];

    var expected = [{
      'properties': ukProps,
      'geometry':{
        'type':'Polygon',
        'coordinates':[
          [
            [1.020001,1],[1.0196167,0.9960986],[1.0184785,0.9923471],[1.0166302,0.9888897],[1.0141428,0.9858593],
            [1.011112,0.9833723],[1.007654,0.9815243],[1.003902,0.9803863],[1,0.980002],[0.996098,0.9803863],
            [0.992346,0.9815243],[0.988888,0.9833723],[0.9858572,0.9858593],[0.9833698,0.9888897],[0.9815215,0.9923471],
            [0.9803833,0.9960986],[0.979999,1],[0.9803833,1.0039014],[0.9815215,1.0076529],[0.9833698,1.0111102],
            [0.9858572,1.0141407],[0.988888,1.0166276],[0.992346,1.0184756],[0.996098,1.0196136],[1,1.0199979],
            [1.003902,1.0196136],[1.007654,1.0184756],[1.011112,1.0166276],[1.0141428,1.0141407],[1.0166302,1.0111102],
            [1.0184785,1.0076529],[1.0196167,1.0039014],[1.020001,1]
          ]
        ]
      }
    }];

    var filter = bufferPointRecords.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected);
      t.end();
     });
  });

  test.test('custom radius', function(t) {

    var input = [
      { geometry: {'type': 'Point', 'coordinates':[1.0, 1.0]}, properties: ukProps }
    ];

    var expected = [{
      'properties': ukProps,
      'geometry':{
        'type':'Polygon',
        'coordinates':[
          [
            [1.1000049,1],[1.0980834,0.9804929],[1.0923925,0.9617354],[1.0831511,0.9444482],[1.0707142,0.9292958],
            [1.0555598,0.9168606],[1.0382702,0.9076203],[1.01951,0.9019301],[1,0.9000088],[0.98049,0.9019301],
            [0.9617298,0.9076203],[0.9444402,0.9168606],[0.9292858,0.9292958],[0.9168489,0.9444482],[0.9076075,0.9617354],
            [0.9019166,0.9804929],[0.8999951,1],[0.9019166,1.019507],[0.9076075,1.0382642],[0.9168489,1.0555508],
            [0.9292858,1.0707026],[0.9444402,1.0831373],[0.9617298,1.0923771],[0.98049,1.0980669],[1,1.0999881],
            [1.01951,1.0980669],[1.0382702,1.0923771],[1.0555598,1.0831373],[1.0707142,1.0707026],[1.0831511,1.0555508],
            [1.0923925,1.0382642],[1.0980834,1.019507],[1.1000049,1]
          ]
        ]
      }
    }];

    var filter = bufferPointRecords.create(0.1);

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected);
      t.end();
     });
  });
});