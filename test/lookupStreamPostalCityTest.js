const tape = require('tape');
const test_stream = require('./index').test_stream;
const Document = require('pelias-model').Document;

const stream = require('../src/lookupStream');

tape('tests', (test) => {
  test.test('postal cities - USA lookup - ZIP 18964', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '18964');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Souderton', '101717367', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '18964');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  // test that locality is not changed if borough is changed
  test.test('postal cities - USA lookup - ZIP 11215 (Brooklyn, NY)', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '11215');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'borough', 'Brooklyn', '421205765', undefined)
      .addParent( 'locality', 'New York', '2', 'NYC')
      .setAddress('zip', '11215');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'New York', abbr: 'NYC'} ],
          borough: [ { id: 421205765, name: 'Brooklyn'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 21236 (Perry Hall, MD)', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '21236');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Nottingham', '1125996559')
      .addParent( 'locality', 'Baltimore', '85949461')
      .addParent( 'locality', 'Perry Hall', '85950213')
      .addParent( 'locality', 'White Marsh', '85950229')
      .addParent( 'locality', 'Fullerton', '1310025487')
      .setAddress('zip', '21236');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: '85950213', name: 'Perry Hall'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 11238 (Brooklyn)', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '3')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '11238');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '3')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'borough', 'Brooklyn', '421205765')
      .addParent( 'locality', 'New York', '85977539', 'NYC')
      .setAddress('zip', '11238');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          borough: [ {id: 421205765, name: 'Brooklyn'} ],
          locality: [ {id: 85977539, name: 'New York', abbr: 'NYC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should NOT be replaced with postal city if already in a parent field');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 11238 (Brooklyn) - use postal burough when one not returned from PIP', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '3')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '11238');

    const expectedDoc = new Document('whosonfirst', 'placetype', '3')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('borough', 'Brooklyn', '421205765')
      .addParent('locality', 'New York', '85977539', 'NYC')
      .setAddress('zip', '11238');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }],
          // no borough returned from PIP
          locality: [{ id: 85977539, name: 'New York', abbr: 'NYC' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'use postal burough when one not returned from PIP');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 11238 (Brooklyn) - add postal burough to one not returned from PIP', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '3')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '11238');

    const expectedDoc = new Document('whosonfirst', 'placetype', '3')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('locality', 'New York', '85977539', 'NYC')
      .addParent('borough', 'Brooklyn', '421205765')
      .addParent('borough', 'Example Borough', '999')
      .setAddress('zip', '11238');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }],
          borough: [ {id: 999, name: 'Example Borough'} ],
          locality: [{ id: 85977539, name: 'New York', abbr: 'NYC' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'use postal burough when one not returned from PIP');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 21236', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '21236');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Nottingham', '1125996559', undefined)
      .addParent( 'locality', 'Baltimore', '85949461', undefined)
      .addParent( 'locality', 'Perry Hall', '85950213', undefined)
      .addParent( 'locality', 'White Marsh', '85950229', undefined)
      .addParent( 'locality', 'Fullerton', '1310025487')
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '21236');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 17033', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '17033');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Hershey', '101719813', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '17033');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 17036', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '17036');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Hummelstown', '101717689', undefined)
      .addParent( 'locality', 'Hershey', '101719813', undefined)
      .addParent( 'locality', 'Harrisburg', '101717693', undefined)
      .addParent( 'locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '17036');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ],
          locality: [ {id: 2, name: 'Locality 1', abbr: 'ABC'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 95616 - no PIP locality', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '95616');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Davis', '85922419', undefined)
      .setAddress('zip', '95616');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 94610 - including state prefix and ZIP+4', (t) => {
    const inputDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', 'CA 94610-2737');

    const expectedDoc = new Document( 'whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent( 'country', 'United States', '1', 'USA')
      .addParent( 'locality', 'Piedmont', '85921877', undefined)
      .addParent( 'locality', 'Oakland', '85921881', undefined)
      .setAddress('zip', 'CA 94610-2737');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [ {id: 1, name: 'United States', abbr: 'USA'} ]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, {usePostalCities: true});
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 19087 - no PIP locality', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '19087');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('locality', 'Wayne', '1125777935', undefined)
      .addParent('locality', 'Chesterbrook', '101720389', undefined)
      .addParent('locality', 'Radnor', '1126040557', undefined)
      .addParent('locality', 'Radnor Township', '1259695015', undefined)
      .addParent('locality', 'Strafford', '1126057861', undefined)
      .setAddress('zip', '19087');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 34119 - no PIP locality', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '34119');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('locality', 'Naples', '85931799', undefined)
      .setAddress('zip', '34119');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 08540 - no PIP locality', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '08540');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('locality', 'Princeton', '85975813', undefined)
      .addParent('locality', 'Franklin Township', '1125871549', undefined)
      .addParent('locality', 'Montgomeryville', '101719543', undefined)
      .addParent('locality', 'Princeton Junction', '85976395', undefined)
      .addParent('locality', 'South Brunswick Township', '1125771473', undefined)
      .setAddress('zip', '08540');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 40047 - no PIP locality', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '40047');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('locality', 'Mount Washington', '85946765', undefined)
      .addParent('locality', 'Louisville', '85947523', undefined)
      .setAddress('zip', '40047');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
        t.end();
      });
    });
  });

  test.test('postal cities - USA lookup - ZIP 11377 - Queens County', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .setAddress('zip', '11377');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'United States', '1', 'USA')
      .addParent('borough', 'Queens', '421205767')
      .addParent('borough', 'Manhattan', '421205771')
      .addParent('locality', 'Locality 1', '2', 'ABC')
      .setAddress('zip', '11377');

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 1, name: 'United States', abbr: 'USA' }],
          locality: [{ id: 2, name: 'Locality 1', abbr: 'ABC' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { usePostalCities: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc],
          'Queens ZIP should ALWAYS have "Queens" set for primary borough');
        t.end();
      });
    });
  });

  // test commented-out due to AUS table currently being disabled
  // test.test('postal cities - AUS lookup - POSTCODE 2612 - no PIP locality', (t) => {
  //   const inputDoc = new Document('whosonfirst', 'placetype', '1')
  //     .setCentroid({ lat: 12.121212, lon: 21.212121 })
  //     .setAddress('zip', '2612');

  //   const expectedDoc = new Document('whosonfirst', 'placetype', '1')
  //     .setCentroid({ lat: 12.121212, lon: 21.212121 })
  //     .addParent('country', 'Australia', '1', 'AUS')
  //     .addParent('locality', 'Campbell', '101938727', undefined)
  //     .setAddress('zip', '2612');

  //   const resolver = {
  //     lookup: (centroid, search_layers, callback) => {
  //       const result = {
  //         country: [{ id: 1, name: 'Australia', abbr: 'AUS' }]
  //       };
  //       setTimeout(callback, 0, null, result);
  //     }
  //   };

  //   const lookupStream = stream(resolver, { usePostalCities: true });
  //   t.doesNotThrow(() => {
  //     test_stream([inputDoc], lookupStream, (err, actual) => {
  //       t.deepEqual(actual, [expectedDoc], 'locality should be replaced with postal city');
  //       t.end();
  //     });
  //   });
  // });

});
