const path = require('path');
const express = require('express');
/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {

  middleware: {
    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'uploads',
      'router',
      'www',
      'favicon',
    ],

    // Existing bodyParser stays untouched
    bodyParser: (function _configureBodyParser() {
      const skipper = require('skipper');
      return skipper({ strict: true });
    })(),
      
    // Assets middleware to serve uploaded files
    uploads: (function () {
      const assetsPath = path.resolve(__dirname, '../assets');
      return express.static(assetsPath, {
        setHeaders: (res, filePath) => {
          console.log('Serving file:', filePath);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
        index: false
      });
    })(),
  },
};
