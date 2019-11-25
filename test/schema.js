const tape = require( 'tape' );
const Joi = require('@hapi/joi');
const schema = require( '../schema' );
const os = require('os');

tape('test configuration scenarios', (test) =>  {
  test.test('missing imports should throw error', (t) =>  {
    const config = {};

    const result = schema.validate(config);

    t.equals(result.error.details.length, 1);
    t.equals(result.error.details[0].message, '"imports" is required');
    t.end();

  });

  test.test('non-object imports should throw error', (t) =>  {
    [null, 17, 'string', [], true].forEach((value) => {
      const config = { imports: value };

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports" must be of type object');
    });

    t.end();

  });

  test.test('if imports.whosonfirst is missing services.pip should be required', (t) =>  {
    const config = {
      imports: {}
    };

    const result = schema.validate(config);

    t.equals(result.error.details.length, 1);
    t.equals(result.error.details[0].message, '"imports" must contain at least one of [whosonfirst, services.pip]');
    t.end();

  });

  test.test('missing imports.whosonfirst.datapath should throw error', (t) =>  {
    const config = {
      imports: {
        whosonfirst: {}
      }
    };

    const result = schema.validate(config);

    t.equals(result.error.details.length, 1);
    t.equals(result.error.details[0].message, '"imports.whosonfirst.datapath" is required');
    t.end();

  });

  test.test('missing imports.adminLookup should not throw error', (t) =>  {
    const config = {
      imports: {
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    const result = schema.validate(config);

    t.notOk(result.error);
    t.end();

  });

  test.test('non-object imports.adminLookup should throw error', (t) =>  {
    [null, 17, 'string', [], true].forEach((value) => {
      const config = {
        imports: {
          adminLookup: value,
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports.adminLookup" must be of type object');
    });

    t.end();

  });

  test.test('non-number imports.adminLookup.maxConcurrentReqs should throw error', (t) =>  {
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

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports.adminLookup.maxConcurrentReqs" must be a number');

    });

    t.end();

  });

  test.test('non-integer imports.adminLookup.maxConcurrentReqs should throw error', (t) =>  {
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

    const result = schema.validate(config);

    t.equals(result.error.details.length, 1);
    t.equals(result.error.details[0].message, '"imports.adminLookup.maxConcurrentReqs" must be an integer');
    t.end();

  });

  test.test('missing imports.adminLookup.maxConcurrentReqs should default to number of cpus * 10', (t) =>  {
    const config = {
      imports: {
        adminLookup: {
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    const result = schema.validate(config);

    t.equals(result.value.imports.adminLookup.maxConcurrentReqs, os.cpus().length*10);
    t.notOk(result.error);
    t.end();

  });

  test.test('non-boolean imports.adminLookup.enabled should throw error', (t) =>  {
    [null, 'string', {}, [], 17].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: 17,
            enabled: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports.adminLookup.enabled" must be a boolean');

    });

    t.end();

  });

  test.test('boolean imports.adminLookup.enabled should not throw error', (t) =>  {
    [true, false].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: 17,
            enabled: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      const result = schema.validate(config);

      t.notOk(result.error);

    });

    t.end();

  });

  test.test('missing imports.adminLookup.enabled should default to true', (t) =>  {
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

    const result = schema.validate(config);

    t.notOk(result.error);
    t.equals(result.value.imports.adminLookup.enabled, true);
    t.end();

  });

  test.test('non-boolean imports.adminLookup.missingMetafilesAreFatal should throw error', (t) =>  {
    [null, 'string', {}, [], 17].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: 17,
            missingMetafilesAreFatal: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports.adminLookup.missingMetafilesAreFatal" must be a boolean');

    });

    t.end();

  });

  test.test('boolean imports.adminLookup.missingMetafilesAreFatal should not throw error', (t) =>  {
    [true, false].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: 17,
            missingMetafilesAreFatal: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      const result = schema.validate(config);

      t.notOk(result.error);

    });

    t.end();

  });

  test.test('missing imports.adminLookup.missingMetafilesAreFatal should default to false', (t) =>  {
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

    const result = schema.validate(config);

    t.notOk(result.error);
    t.equals(result.value.imports.adminLookup.missingMetafilesAreFatal, false);
    t.end();

  });

  test.test('integer imports.adminLookup.maxConcurrentReqs should not throw error', (t) =>  {
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

    const result = schema.validate(config);

    t.notOk(result.error);
    t.end();

  });

  test.test('non-string imports.whosonfirst.datapath should throw error', (t) =>  {
    [null, 17, {}, [], true].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: value
          }
        }
      };

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports.whosonfirst.datapath" must be a string');
    });

    t.end();

  });

  test.test('unknown properties should not throw errors', (t) =>  {
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

    const result = schema.validate(config);

    t.notOk(result.error);
    t.end();

  });

  test.test('missing imports.services.pip should throw error', (t) =>  {
    const config = {
      imports: {
        services: { interpolation: {} }
      },
    };

    const result = schema.validate(config);

    t.equals(result.error.details.length, 1);
    t.equals(result.error.details[0].message, '"imports" must contain at least one of [whosonfirst, services.pip]');
    t.end();

  });

  test.test('missing imports.services.pip.url should throw error', (t) =>  {
    const config = {
      imports: {
        services: { pip: {} }
      },
    };

    const result = schema.validate(config);

    t.equals(result.error.details.length, 1);
    t.equals(result.error.details[0].message, '"imports.services.pip.url" is required');
    t.end();

  });

  test.test('non-string imports.services.pip.url should throw error', (t) =>  {
    [null, 17, {}, [], true].forEach((value) => {
      const config = {
        imports: {
          services: {
            pip: { url: value }
          }
        },
      };

      const result = schema.validate(config);

      t.equals(result.error.details.length, 1);
      t.equals(result.error.details[0].message, '"imports.services.pip.url" must be a string');
    });

    t.end();

  });

});
