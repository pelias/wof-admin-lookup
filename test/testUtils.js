const fs = require('fs');
const path = require('path');

module.exports.customConfig = (directory, config) => {
  const configFilename = path.join(directory, 'config.json');

  fs.writeFileSync(configFilename, JSON.stringify(config));
  process.env.PELIAS_CONFIG = configFilename;

  return {
    content: config,
    unset: () => {
      delete process.env.PELIAS_CONFIG;
    }
  };
};