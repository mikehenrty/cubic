'use strict';

var jsonfile = require('jsonfile');
var os = require('os');
var path = require('path');

// Defaults are defined here, but can be overridden in local config.
const DEBUG = false;  // set to true for debug logging.
const BASE_PATH = path.resolve(__dirname, '../');
const PORT = 8021;
const WS_PORT = 8022;
const BASE_URL = `http:\/\/${os.hostname()}:${PORT}\/`;
const SITE_PATH = path.resolve(BASE_PATH, 'client');

const DB_USER = 'cubic';
const DB_PASSWORD = 'default';
const DB_NAME = 'cubic';
const MONGO_PORT = 27017;

var CONST = {
  DEBUG: DEBUG,
  PORT: PORT,
  WS_PORT: WS_PORT,
  BASE_PATH: BASE_PATH,
  BASE_URL: BASE_URL,
  SITE_PATH: SITE_PATH,
  DB_USER: DB_USER,
  DB_PASSWORD: DB_PASSWORD,
  DB_NAME: DB_NAME,
  MONGO_PORT: MONGO_PORT,
};

var config = jsonfile.readFileSync(
  path.resolve(CONST.BASE_PATH, 'local_config.json'));

Object.getOwnPropertyNames(config).forEach(key => {
  CONST[key] = config[key];
});

module.exports = CONST;
