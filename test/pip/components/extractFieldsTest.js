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
    input.properties['wof:placetype'] = 'Feature placetype';
    input.properties['wof:hierarchy'] = 'Feature hierarchy';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'Feature placetype',
        Hierarchy: 'Feature hierarchy'
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
    input.properties['wof:hierarchy'] = 'Feature hierarchy';
    input.properties['qs:a2_alt'] = 'a2_alt value';

    var expected = {
      properties: {
        Id: 17,
        Name: 'a2_alt value',
        Placetype: 'county',
        Hierarchy: 'Feature hierarchy'
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
    input.properties['wof:hierarchy'] = 'Feature hierarchy';
    input.properties['qs:a2_alt'] = 'a2_alt value';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'county',
        Hierarchy: 'Feature hierarchy'
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
    input.properties['wof:hierarchy'] = 'Feature hierarchy';
    input.properties['qs:a2_alt'] = 'a2_alt value';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'non-county',
        Hierarchy: 'Feature hierarchy'
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
    input.properties['wof:hierarchy'] = 'Feature hierarchy';

    var expected = {
      properties: {
        Id: 17,
        Name: 'Feature name',
        Placetype: 'county',
        Hierarchy: 'Feature hierarchy'
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
    input.properties['wof:hierarchy'] = 'Feature hierarchy';

    var expected = {
      properties: {
        Id: 17,
        Name: 'wof:label value',
        Placetype: 'county',
        Hierarchy: 'Feature hierarchy'
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('store wof:country converted to ISO3 for country placetypes', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'wof:name value';
    input.properties['wof:country'] = 'US';
    input.properties['wof:placetype'] = 'country';

    var expected = {
      properties: {
        Id: 17,
        Name: 'wof:name value',
        Placetype: 'country',
        Abbrev: 'USA',
        Hierarchy: undefined,
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

  test.test('Ignore XX country coodes', function(t) {
    var input = {
      properties: {}
    };
    input.properties['wof:id'] = 17;
    input.properties['wof:name'] = 'wof:name value';
    input.properties['wof:country'] = 'XX';
    input.properties['wof:placetype'] = 'country';

    var expected = {
      properties: {
        Id: 17,
        Name: 'wof:name value',
        Placetype: 'country',
        Abbrev: null,
        Hierarchy: undefined,
      },
      geometry: undefined
    };

    var extractFields = require('../../../src/pip/components/extractFields').create();

    test_stream([input], extractFields, function(err, actual) {
      t.deepEqual(actual, [expected], 'should be equal');
      t.end();
    });

  });

});
