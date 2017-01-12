'use strict';

const tape = require('tape');

const configValidation = require('../src/configValidation');
const proxyquire = require('proxyquire').noCallThru();

tape('tests configuration scenarios', function(test) {
  test.test('missing imports should throw error', function(t) {
    const config = {};

    t.throws(function() {
      configValidation.validate(config);
    }, /"imports" is required/);
    t.end();

  });

  test.test('non-object imports should throw error', function(t) {
    [null, 17, 'string', [], true].forEach((value) => {
      const config = { imports: value };

      t.throws(function() {
        configValidation.validate(config);
      }, /"imports" must be an object/);
    });

    t.end();

  });

  test.test('missing imports.whosonfirst should throw error', function(t) {
    const config = {
      imports: {}
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"whosonfirst" is required/);
    t.end();

  });

  test.test('missing imports.whosonfirst.datapath should throw error', function(t) {
    const config = {
      imports: {
        whosonfirst: {}
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"datapath" is required/);
    t.end();

  });

  test.test('missing imports.adminLookup should not throw error', function(t) {
    const config = {
      imports: {
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.doesNotThrow(function() {
      configValidation.validate(config);
    });
    t.end();

  });

  test.test('non-object imports.adminLookup should throw error', function(t) {
    [null, 17, 'string', [], true].forEach((value) => {
      const config = {
        imports: {
          adminLookup: value,
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      t.throws(function() {
        configValidation.validate(config);
      }, /"adminLookup" must be an object/);
    });

    t.end();

  });

  test.test('non-number imports.adminLookup.maxConcurrentReqs should throw error', function(t) {
    [null, 'string', {}, [], true].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      t.throws(function() {
        configValidation.validate(config);
      }, /"maxConcurrentReqs" must be a number/);

    });

    t.end();

  });

  test.test('non-integer imports.adminLookup.maxConcurrentReqs should throw error', function(t) {
    const config = {
      imports: {
        adminLookup: {
          maxConcurrentReqs: 17.3
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"maxConcurrentReqs" must be an integer/);

    t.end();

  });

  test.test('missing imports.adminLookup.maxConcurrentReqs should not throw error', function(t) {
    const config = {
      imports: {
        adminLookup: {
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.doesNotThrow(function() {
      configValidation.validate(config);
    });

    t.end();

  });

  test.test('integer imports.adminLookup.maxConcurrentReqs should not throw error', function(t) {
    const config = {
      imports: {
        adminLookup: {
          maxConcurrentReqs: 17
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.doesNotThrow(function() {
      configValidation.validate(config);
    });

    t.end();

  });

  test.test('non-string imports.whosonfirst.datapath should throw error', function(t) {
    [null, 17, {}, [], true].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: value
          }
        }
      };

      t.throws(function() {
        configValidation.validate(config);
      }, /"datapath" must be a string/);
    });

    t.end();

  });

  test.test('unknown properties should not throw errors', function(t) {
    const config = {
      imports: {
        adminLookup: {
          maxConcurrentReqs: 17,
          unknown_property: 'property value'
        },
        whosonfirst: {
          datapath: 'datapath value',
          unknown_property: 'property value'
        },
        unknown_property: 'property value'
      },
      unknown_property: 'property value'
    };

    t.doesNotThrow(function() {
      configValidation.validate(config);
    });

    t.end();

  });

});

tape('tests for main entry point', function(test) {
  test.test('configValidation throwing error should rethrow', function(t) {
    const config = {};

    t.throws(function() {
      proxyquire('../index', {
        './src/configValidation': {
          validate: () => {
            throw Error('config is not valid');
          }
        }
      });

      configValidation.validate(config);
    }, /config is not valid/);
    t.end();

  });
});
