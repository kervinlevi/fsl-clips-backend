/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

    // Users
    'POST /user/create': 'UserController.create',
    'POST /user/login': 'UserController.login',
    'GET /users': 'UserController.findAll',
    'GET /user/:user_id': 'UserController.find',
    'POST /user/:user_id': 'UserController.update',
    'DELETE /user/:user_id': 'UserController.delete',
    'POST /token/refresh': 'UserController.refreshToken',
    'GET /self': 'UserController.findSelf',
    'POST /self/update': 'UserController.updateSelf',
    'DELETE /self/delete': 'UserController.deleteSelf',

    // Clips
    'POST /clip': 'ClipController.upload',
    'GET /clips': 'ClipController.findAll',
    'GET /clip/:clip_id': 'ClipController.find',
    'GET /randomClips': 'ClipController.fetchRandomClips',
    'POST /clip/:clip_id': 'ClipController.update',
    'DELETE /clip/:clip_id': 'ClipController.delete',

    // Settings
    'GET /settings': 'SettingsController.fetch',
    'POST /settings': 'SettingsController.update'
};
