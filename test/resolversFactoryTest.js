var tape = require('tape');
var http = require('http');
var intercept = require('intercept-stdout');

var resolvers = require('../src/resolversFactory');

tape('tests', function(test) {
  test.test('return value should be parsed from server response', function(t) {
    var server = http.createServer(function(req, res) {
      res.end(JSON.stringify([
        {
          Id: 1,
          Name: 'Country 1',
          Placetype: 'country',
          Abbrev: 'ABC'
        },
        {
          Id: 2,
          Name: 'Region 1',
          Placetype: 'region'
        },
        {
          Id: 3,
          Name: 'County 1',
          Placetype: 'county'
        },
        {
          Id: 4,
          Name: 'Locality 1',
          Placetype: 'locality'
        },
        {
          Id: 5,
          Name: 'LocalAdmin 1',
          Placetype: 'localadmin'
        },
        {
          Id: 6,
          Name: 'Borough 1',
          Placetype: 'borough'
        },
        {
          Id: 7,
          Name: 'Neighbourhood 1',
          Placetype: 'neighbourhood'
        },
        {
          Id: 8,
          Name: 'Country 2',
          Placetype: 'country',
          Abbrev: 'DEF'
        },
        {
          Id: 9,
          Name: 'Region 2',
          Placetype: 'region'
        },
        {
          Id: 10,
          Name: 'County 2',
          Placetype: 'county'
        },
        {
          Id: 11,
          Name: 'Locality 2',
          Placetype: 'locality'
        },
        {
          Id: 12,
          Name: 'LocalAdmin 2',
          Placetype: 'localadmin'
        },
        {
          Id: 13,
          Name: 'Borough 2',
          Placetype: 'borough'
        },
        {
          Id: 14,
          Name: 'Neighbourhood 2',
          Placetype: 'neighbourhood'
        }
      ]));
    });

    server.listen(0);

    var resolver = resolvers.createWofPipResolver('http://localhost:' + server.address().port + '/?');

    var centroid = {
      lat: 12.121212,
      lon: 21.212121
    };

    // intercept/swallow stderr
    var stderr = '';
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    var callback = function(err, result) {
      var expected = {
        country: [
          { id: 1, name: 'Country 1', abbr: 'ABC'},
          { id: 8, name: 'Country 2', abbr: 'DEF'},
        ],
        region: [
          { id: 2, name: 'Region 1'},
          { id: 9, name: 'Region 2'},
        ],
        county: [
          { id: 3, name: 'County 1'},
          { id: 10, name: 'County 2'},
        ],
        locality: [
          { id: 4, name: 'Locality 1'},
          { id: 11, name: 'Locality 2'},
        ],
        localadmin: [
          { id: 5, name: 'LocalAdmin 1'},
          { id: 12, name: 'LocalAdmin 2'},
        ],
        borough: [
          { id: 6, name: 'Borough 1'},
          { id: 13, name: 'Borough 2'},
        ],
        neighbourhood: [
          { id: 7, name: 'Neighbourhood 1'},
          { id: 14, name: 'Neighbourhood 2'},
        ]
      };

      // stop hijacking STDERR
      unhook_intercept();

      t.equal(err, null, 'there should be no error');
      t.deepEqual(result, expected);
      t.equal(stderr, '', 'nothing should have been written to stderr');
      t.end();
      resolver.end();
      server.close();

    };

    resolver.lookup(centroid, callback);

  });

  test.test('url not prefixed with http:// should have it prepended', function(t) {
    var server = http.createServer(function(req, res) {
      res.end(JSON.stringify([
        {
          Id: 1,
          Name: 'Country 1',
          Placetype: 'country',
          Abbrev: 'ABC'
        }
      ]));
    });

    server.listen(0);

    var resolver = resolvers.createWofPipResolver('localhost:' + server.address().port + '/?');

    var centroid = {
      lat: 12.121212,
      lon: 21.212121
    };

    // intercept/swallow stderr
    var stderr = '';
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    var callback = function(err, result) {
      var expected = {
        country: [
          { id: 1, name: 'Country 1', abbr: 'ABC'}
        ]
      };

      // stop hijacking STDERR
      unhook_intercept();

      t.equal(err, null, 'there should be no error');
      t.deepEqual(result, expected);
      t.equal(stderr, '', 'nothing should have been written to stderr');
      t.end();
      resolver.end();
      server.close();

    };

    resolver.lookup(centroid, callback);

  });

  test.test('error condition', function(t) {
    var resolver = resolvers.createWofPipResolver('http://localhost:12345/?');

    var centroid = {
      lat: 12.121212,
      lon: 21.212121
    };

    // intercept/swallow stderr
    var stderr = '';
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    var callback = function(err, result) {
      // stop hijacking STDERR
      unhook_intercept();

      t.notEqual(err, null, 'there should have been an error');
      t.equal(result, null, 'result should be null on error');
      t.notEqual(stderr, '', 'an error message should have been logged');
      t.end();

    };

    resolver.lookup(centroid, callback);

  });

  test.test('service returning non-200 status code should return error condition', function(t) {
    var server = http.createServer(function(req, res) {
      res.statusCode = 402;
      res.end('Handing back a 402');
    });

    server.listen(0);

    var resolver = resolvers.createWofPipResolver('http://localhost:' + server.address().port + '/?');

    var centroid = {
      lat: 12.121212,
      lon: 21.212121
    };

    // intercept/swallow stderr
    var stderr = '';
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    var callback = function(err, result) {
      // stop hijacking STDERR
      unhook_intercept();

      t.deepEqual(err, {
        centroid: { lat: 12.121212, lon: 21.212121},
        statusCode: 402,
        text: 'Handing back a 402'
      }, 'there should have been an error');

      t.equal(result, null, 'result should be null on error');

      t.deepEqual(JSON.parse(stderr),
        {
          'centroid':{'lat':12.121212,'lon':21.212121},
          'statusCode':402,
          'text':'Handing back a 402'
        },
        'error message should have been written to stderr');

      t.end();
      server.close();
      resolver.end();

    };

    resolver.lookup(centroid, callback);

  });

});
