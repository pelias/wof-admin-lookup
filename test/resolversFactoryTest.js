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
          Placetype: 'country'
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
          Name: 'Neighbourhood 1',
          Placetype: 'neighbourhood'
        },
        {
          Id: 7,
          Name: 'Country 2',
          Placetype: 'country'
        },
        {
          Id: 8,
          Name: 'Region 2',
          Placetype: 'region'
        },
        {
          Id: 9,
          Name: 'County 2',
          Placetype: 'county'
        },
        {
          Id: 10,
          Name: 'Locality 2',
          Placetype: 'locality'
        },
        {
          Id: 11,
          Name: 'LocalAdmin 2',
          Placetype: 'localadmin'
        },
        {
          Id: 12,
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
          { id: 1, name: 'Country 1'},
          { id: 7, name: 'Country 2'},
        ],
        region: [
          { id: 2, name: 'Region 1'},
          { id: 8, name: 'Region 2'},
        ],
        county: [
          { id: 3, name: 'County 1'},
          { id: 9, name: 'County 2'},
        ],
        locality: [
          { id: 4, name: 'Locality 1'},
          { id: 10, name: 'Locality 2'},
        ],
        localadmin: [
          { id: 5, name: 'LocalAdmin 1'},
          { id: 11, name: 'LocalAdmin 2'},
        ],
        neighbourhood: [
          { id: 6, name: 'Neighbourhood 1'},
          { id: 12, name: 'Neighbourhood 2'},
        ]
      };

      // stop hijacking STDERR
      unhook_intercept();

      t.equal(err, null, 'there should be no error');
      t.deepEqual(result, expected);
      t.equal(stderr, '', 'nothing should have been written to stderr');
      t.end();
      server.close();

    };

    resolver(centroid, callback);

  });

  test.test('url not prefixed with http:// should have it prepended', function(t) {
    var server = http.createServer(function(req, res) {
      res.end(JSON.stringify([
        {
          Id: 1,
          Name: 'Country 1',
          Placetype: 'country'
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
          { id: 1, name: 'Country 1'}
        ]
      };

      // stop hijacking STDERR
      unhook_intercept();

      t.equal(err, null, 'there should be no error');
      t.deepEqual(result, expected);
      t.equal(stderr, '', 'nothing should have been written to stderr');
      t.end();
      server.close();

    };

    resolver(centroid, callback);

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

    resolver(centroid, callback);

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

    };

    resolver(centroid, callback);

  });

});
