var tape = require('tape');
var http = require('http');

var resolvers = require('../src/resolversFactory');

tape('tests', function(test) {
  test.test('return value should be parsed from server response', function(t) {
    var server = http.createServer(function(req, res) {
      res.end(JSON.stringify([
        {
          Name: 'Country',
          Placetype: 'country'
        },
        {
          Name: 'Region',
          Placetype: 'region'
        },
        {
          Name: 'County',
          Placetype: 'county'
        },
        {
          Name: 'Locality',
          Placetype: 'locality'
        },
        {
          Name: 'Neighbourhood',
          Placetype: 'neighbourhood'
        }
      ]));
    });

    server.listen(0);

    var resolver = resolvers.createWofPipResolver('http://localhost:' + server.address().port + '/?');

    var centroid = {
      lat: 12.121212,
      lon: 21.212121
    }

    var callback = function(result) {
      var expected = {
        country: 'Country',
        region: 'Region',
        county: 'County',
        locality: 'Locality',
        neighbourhood: 'Neighbourhood'
      };

      t.deepEqual(result, expected);
      t.end();
      server.close();

    };

    resolver(centroid, callback);

  });

});
