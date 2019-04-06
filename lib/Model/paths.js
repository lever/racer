var Model = require('./Model');

exports.mixin = {};

/**
 * Returns the absolute path segments for this model's scope, with an optional
 * relative subpath suffix.
 *
 * Note: Some returned path segments may still need to be converted from strings
 * to numbers.
 *
 * @param {string | number | Array<string | number> | {path(): string}} [subpath]
 *   optional subpath
 * @return Array<string | number>
 */
Model.prototype._splitPath = function(subpath) {
  if (Array.isArray(subpath)) {
    // TODO: Refactor Model's _at to be an array. Repeatedly splitting and
    // joining strings is an unnecessary expense for most internal methods.
    var path = this.path();
    var pathSegments = path ? path.split('.') : [];
    Array.prototype.push.apply(pathSegments, subpath);
    return pathSegments;
  }
  var path = this.path(subpath);
  return (path && path.split('.')) || [];
};

/**
 * Returns the path equivalent to the path of the current scoped model plus
 * (optionally) a suffix subpath
 *
 * @param {string | number | {path(): string}} [subpath] optional subpath
 * @return {string} absolute path
 * @api public
 */
Model.prototype.path = function(subpath) {
  if (subpath == null || subpath === '') return (this._at) ? this._at : '';
  if (typeof subpath === 'string' || typeof subpath === 'number') {
    return (this._at) ? this._at + '.' + subpath : '' + subpath;
  }
  if (typeof subpath.path === 'function') return subpath.path();
};

Model.prototype.isPath = function(subpath) {
  return this.path(subpath) != null;
};

Model.prototype.scope = function(path) {
  var model = this._child();
  model._at = path;
  return model;
};

/**
 * Create a model object scoped to a particular path.
 * Example:
 *     var user = model.at('users.1');
 *     user.set('username', 'brian');
 *     user.on('push', 'todos', function(todo) {
 *       // ...
 *     });
 *
 *  @param {String} segment
 *  @return {Model} a scoped model
 *  @api public
 */
Model.prototype.at = function(subpath) {
  if (Array.isArray(subpath)) {
    subpath = subpath.join('.');
  }
  var path = this.path(subpath);
  return this.scope(path);
};

/**
 * Returns a model scope that is a number of levels above the current scoped
 * path. Number of levels defaults to 1, so this method called without
 * arguments returns the model scope's parent model scope.
 *
 * @optional @param {Number} levels
 * @return {Model} a scoped model
 */
Model.prototype.parent = function(levels) {
  if (levels == null) levels = 1;
  var segments = this._splitPath();
  var len = Math.max(0, segments.length - levels);
  var path = segments.slice(0, len).join('.');
  return this.scope(path);
};

/**
 * Returns the last property segment of the current model scope path
 *
 * @optional @param {String} path
 * @return {String}
 */
Model.prototype.leaf = function(path) {
  if (!path) path = this.path();
  var i = path.lastIndexOf('.');
  return path.slice(i + 1);
};
