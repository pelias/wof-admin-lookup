var tape = require('tape');
var event_stream = require('event-stream');

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('extractFields tests', function(test) {
  test.test('non-special case record', function(t) {
    var input = {
      properties: {},
      geometry: 'Geometry'
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:abbreviation'] = 'Feature abbreviation';
    input.properties['wof:shortcode'] = 'Feature shortcode, preferred';
    input.properties['wof:placetype'] = 'Feature placetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      },
      {
        placetype3: 56
      }
    ];
    input.properties['geom:latitude'] = 12.121212;
    input.properties['geom:longitude'] = 21.212121;
    input.properties['geom:bbox'] = 'Feature boundingbox';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: 'Feature shortcode, preferred',
        Placetype: 'Feature placetype',
        Hierarchy: [
          [ 12, 34 ],
          [ 56 ]
        ],
        Centroid: {
          lat: 12.121212,
          lon: 21.212121
        },
        BoundingBox: 'Feature boundingbox'
      },
      geometry: 'Geometry'
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('wof:abbreviation is used if wof:shortcode is not found', function(t) {
    var input = {
      properties: {},
      geometry: 'Geometry'
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:abbreviation'] = 'Feature abbreviation';
    input.properties['wof:placetype'] = 'Feature placetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      },
      {
        placetype3: 56
      }
    ];
    input.properties['geom:latitude'] = 12.121212;
    input.properties['geom:longitude'] = 21.212121;
    input.properties['geom:bbox'] = 'Feature boundingbox';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: 'Feature abbreviation',
        Placetype: 'Feature placetype',
        Hierarchy: [
          [ 12, 34 ],
          [ 56 ]
        ],
        Centroid: {
          lat: 12.121212,
          lon: 21.212121
        },
        BoundingBox: 'Feature boundingbox'
      },
      geometry: 'Geometry'
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('US county placetype with qs:a2_alt should use that as name value', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['iso:country'] = 'US';
    input.properties['wof:placetype'] = 'county';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      }
    ];
    input.properties['qs:a2_alt'] = 'a2_alt value';
    input.properties['wof:country_alpha3'] = 'USA';

    var expected = {
      properties: {
        Id: 17,
        Name: 'a2_alt value',
        Abbrev: undefined,
        Placetype: 'county',
        Hierarchy: [
          [ 12, 34 ]
        ],
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('county placetype with qs:a2_alt but not US should use wof:name', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['iso:country'] = 'non-US';
    input.properties['wof:placetype'] = 'county';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      }
    ];
    input.properties['qs:a2_alt'] = 'a2_alt value';
    input.properties['wof:country_alpha3'] = 'USA';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: undefined,
        Placetype: 'county',
        Hierarchy: [
          [ 12, 34 ]
        ],
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('US ISO but non-county placetype with qs:a2_alt should use wof:name', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['iso:country'] = 'US';
    input.properties['wof:placetype'] = 'non-county';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      }
    ];
    input.properties['qs:a2_alt'] = 'a2_alt value';
    input.properties['wof:country_alpha3'] = 'USA';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: undefined,
        Placetype: 'non-county',
        Hierarchy: [
          [ 12, 34 ]
        ],
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('US county placetype but without qs:a2_alt should use wof:name', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['iso:country'] = 'US';
    input.properties['wof:placetype'] = 'county';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: undefined,
        Placetype: 'county',
        Hierarchy: [
          [ 12, 34 ]
        ],
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('when available, wof:label should be used instead of wof:name', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:label'] = 'wof:label value';
    input.properties['wof:name'] = 'wof:name value';
    input.properties['iso:country'] = 'US';
    input.properties['wof:placetype'] = 'county';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12,
        placetype2: 34
      }
    ];
    input.properties['wof:country_alpha3'] = 'USA';

    var expected = {
      properties: {
        Id: 17,
        Name: 'wof:label value',
        Abbrev: undefined,
        Placetype: 'county',
        Hierarchy: [
          [ 12, 34 ]
        ],
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('record without hierarchy should substitute single-element array of record id', t => {
    const input = {
      properties: {
        'wof:id': 17,
        'wof:name': 'Feature name',
        'wof:abbreviation': 'Feature abbreviation',
        'wof:placetype': 'Feature placetype',
        'geom:latitude': 12.121212,
        'geom:longitude': 21.212121,
        'geom:bbox': 'Feature boundingbox'
      },
      geometry: 'Geometry'
    };

    const expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: 'Feature abbreviation',
        Placetype: 'Feature placetype',
        Hierarchy: [
          [ 17 ]
        ],
        Centroid: {
          lat: 12.121212,
          lon: 21.212121
        },
        BoundingBox: 'Feature boundingbox'
      },
      geometry: 'Geometry'
    };

    const extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, (err, actual) => {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('record with empty hierarchy should substitute single-element array of record id', t => {
    const input = {
      properties: {
        'wof:id': 17,
        'wof:name': 'Feature name',
        'wof:abbreviation': 'Feature abbreviation',
        'wof:placetype': 'Feature placetype',
        'wof:hierarchy': [],
        'geom:latitude': 12.121212,
        'geom:longitude': 21.212121,
        'geom:bbox': 'Feature boundingbox'
      },
      geometry: 'Geometry'
    };

    const expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Abbrev: 'Feature abbreviation',
        Placetype: 'Feature placetype',
        Hierarchy: [
          [ 17 ]
        ],
        Centroid: {
          lat: 12.121212,
          lon: 21.212121
        },
        BoundingBox: 'Feature boundingbox'
      },
      geometry: 'Geometry'
    };

    const extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, (err, actual) => {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

});
