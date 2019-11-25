const Joi = require('@hapi/joi');
const cpus = require('os').cpus;

module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    adminLookup: Joi.object().keys({
      // default maxConcurrentReqs to # of cpus/cores * 10
      maxConcurrentReqs: Joi.number().integer().default(cpus().length*10),
      enabled: Joi.boolean().default(true),
      missingMetafilesAreFatal: Joi.boolean().default(false),
      usePostalCities: Joi.boolean().default(false)
    }).unknown(true),
    whosonfirst: Joi.object().keys({
      datapath: Joi.string().required(),
      importPlace: [
        Joi.number().integer(),
        Joi.array().items(Joi.number().integer())
      ],
      sqlite: Joi.boolean().default(false).truthy('yes').falsy('no')
    }).unknown(true),
    services: Joi.object().keys({
      pip: Joi.object().keys({
        url: Joi.string().required()
      }).unknown(true)
    }).unknown(true)
  }).or('whosonfirst', 'services.pip').unknown(true)
}).unknown(true);
