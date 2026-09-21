const Joi = require('joi');
const os = require('os');

// default parallelism for the parallelTransform stream
// note: this value of 10x the number of cores is historical, and may be too high
// in the future we may want to reduce it to something like 2x
const DEFAULT_PARALLELISM = os.availableParallelism() *10;

// default number of worker threads used for local 'services.spatial' lookups
// capped since larger machines are unlikely to be limited by the lookup workers
const DEFAULT_WORKER_THREADS = Math.min(Math.max(os.availableParallelism() - 1, 1), 16);

module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    adminLookup: Joi.object().keys({
      // default maxConcurrentReqs to # of cpus/cores * 10
      maxConcurrentReqs: Joi.number().integer().default(DEFAULT_PARALLELISM),
      workerThreads: Joi.number().integer().min(1).default(DEFAULT_WORKER_THREADS),
      enabled: Joi.boolean().default(true),
      missingMetafilesAreFatal: Joi.boolean().default(false),
      usePostalCities: Joi.boolean().default(false),
      postalCitiesDataPath: Joi.string(),
      useEndonyms: Joi.boolean().default(false)
    }).unknown(true),
    whosonfirst: Joi.object().keys({
      datapath: Joi.string().required(),
      importPlace: [
        Joi.number().integer(),
        Joi.array().items(Joi.number().integer())
      ],
    }).unknown(true),
    services: Joi.object().keys({
      pip: Joi.object().keys({
        url: Joi.string().required()
      }).unknown(true)
    }).unknown(true)
  }).or('whosonfirst', 'services.pip').unknown(true)
}).unknown(true);
