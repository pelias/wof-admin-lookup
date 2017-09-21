var tape = require('tape');
var event_stream = require('event-stream');
var extractFields = require('../../../src/pip/components/extractFields');


function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('extractFields localized name tests', function(test) {

  test.test('using wof:lang_x_spoken', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_spoken'] = ['rus'];
    input.properties['name:rus_x_preferred'] = ['Russian name'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Russian name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('using wof:lang_x_spoken, not an array', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_spoken'] = 'rus'; // <--- note that the language could be a single string
    input.properties['name:rus_x_preferred'] = 'Russian name'; // <--- note that the name could be a single string
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Russian name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('wof:lang_x_official === [unk]', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_official'] = ['unk'];
    input.properties['name:rus_x_preferred'] = ['Russian name'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('wof:lang_x_official === und', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_official'] = 'und';
    input.properties['name:rus_x_preferred'] = ['Russian name'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('using wof:lang_x_official', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_official'] = ['rus'];
    input.properties['name:rus_x_preferred'] = ['Russian name'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Russian name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('wof:lang_x_spoken has no name, fallback to official', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_spoken'] = ['eng'];
    input.properties['wof:lang_x_official'] = ['rus'];
    input.properties['name:rus_x_preferred'] = ['Russian name'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Russian name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('wof:lang', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang'] = ['rus'];
    input.properties['name:rus_x_preferred'] = ['Russian name'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Russian name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('fallback to wof:label', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:label'] = 'Label name';
    input.properties['wof:lang_x_spoken'] = ['eng'];
    input.properties['wof:lang_x_official'] = ['rus'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Label name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('fallback to wof:name', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:lang_x_spoken'] = ['eng'];
    input.properties['wof:lang_x_official'] = ['rus'];
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('wof:label is empty, fallback to wof:name', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'Feature name';
    input.properties['wof:label'] = '';
    input.properties['iso:country'] = 'RU';
    input.properties['wof:placetype'] = 'someplacetype';
    input.properties['wof:hierarchy'] = [
      {
        placetype1: 12
      }
    ];

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'someplacetype',
        Hierarchy: [ [ 12 ] ],
        Abbrev: undefined,
        Centroid: {
          lat: undefined,
          lon: undefined
        },
        BoundingBox: undefined
      },
      geometry: undefined
    };

    test_stream([input], extractFields.create(true), function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });
});
