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
            [1.020000989800921,0.9999999999999887],[1.0196166763902386,0.9960985924370147],[1.018478505107038,0.9923471094224114],
            [1.016630215235439,0.9888897191072037],[1.0141428355186743,0.9858592881886113],[1.0111119545643203,0.9833722757456588],
            [1.0076540474277156,0.9815242575828423],[1.0039019995409029,0.9803862531089255],[1,0.9800019959354652],
            [0.996098000459097,0.9803862531089255],[0.9923459525722844,0.9815242575828423],[0.9888880454356795,0.9833722757456588],
            [0.9858571644813257,0.9858592881886113],[0.983369784764561,0.9888897191072037],[0.9815214948929619,0.9923471094224114],
            [0.9803833236097613,0.9960985924370147],[0.9799990101990789,0.9999999999999887],[0.9803833236097613,1.0039014029259303],
            [0.9815214948929619,1.007652872735354],[0.983369784764561,1.0111102432876253],[0.9858571644813257,1.0141406508942403],
            [0.9888880454356795,1.0166276400252157],[0.9923459525722844,1.018475638425083],[0.996098000459097,1.0196136296938332],
            [1,1.0199978822302482],[1.003901999540903,1.0196136296938332],[1.0076540474277156,1.018475638425083],
            [1.0111119545643206,1.0166276400252157],[1.0141428355186743,1.0141406508942403],[1.0166302152354392,1.0111102432876253],
            [1.018478505107038,1.007652872735354],[1.0196166763902386,1.0039014029259303],[1.020000989800921,0.9999999999999887]
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
            [1.1000049490046058,0.9999999999999887],[1.098083381951193,0.9804929161763596],[1.09239252553519,0.9617353714197374],
            [1.0831510761771954,0.9444482278372767],[1.0707141775933715,0.9292958489933405],[1.0555597728216022,0.9168605644372969],
            [1.0382702371385784,0.9076202864058684],[1.019509997704515,0.9019301395286876],[1,0.9000088100453079],
            [0.9804900022954849,0.9019301395286876],[0.9617297628614218,0.9076202864058684],[0.9444402271783976,0.9168605644372969],
            [0.9292858224066284,0.9292958489933405],[0.9168489238228047,0.9444482278372767],[0.9076074744648098,0.9617353714197374],
            [0.9019166180488071,0.9804929161763596],[0.8999950509953943,1.0000000000000013],[0.9019166180488071,1.019506967897603],
            [0.9076074744648098,1.038264182524888],[0.9168489238228048,1.0555508320340687],[0.9292858224066285,1.0707026280790808],
            [0.9444402271783978,1.0831373298364804],[0.9617297628614219,1.0923771137952902],[0.9804900022954851,1.098066930543821],
            [1.0000000000000002,1.0999881441014658],[1.0195099977045152,1.098066930543821],[1.0382702371385784,1.0923771137952902],
            [1.0555597728216024,1.0831373298364804],[1.0707141775933717,1.0707026280790808],[1.0831510761771954,1.0555508320340687],
            [1.0923925255351903,1.038264182524888],[1.098083381951193,1.019506967897603],[1.1000049490046058,0.9999999999999887]
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