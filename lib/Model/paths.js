var Model = require('./Model');

exports.mixin = {};

/**
 * Returns the absolute path segments for this model's scope, with an optional
 * relative subpath suffix.
 *
 * Note: Some returned path segments may still need to be converted from strings
 * to numbers.
 *
 * @param {string | number | Array<string | number> | Model} [subpath]
 *   optional subpath
 * @return {string[]}
 */
Model.prototype._splitPath = function(subpath) {
  if (isArrayOrModel(subpath)) {
    return this._pathSegments(subpath);
  }
  var path = this.path(subpath);
  return (path && path.split('.')) || [];
};

/**
 * Returns the path equivalent to the path of the current scoped model plus
 * (optionally) a suffix subpath
 *
 * @param {string | number | Model} [subpath] optional subpath
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

/**
 * Returns the absolute path segments for the path of the current scoped model
 * plus (optionally) a suffix subpath.
 *
 * @param {Array<string | number> | Model} [subpath] optional subpath
 * @returns {string[]} absolute path segments
 */
Model.prototype._pathSegments = function(subpath) {
  if (subpath == null || subpath.length === 0) {
    return this._atSegments || [];
  }
  if (Array.isArray(subpath)) {
    var segments = this._atSegments || [];
    var basePathLength = segments.length;
    segments = segments.concat(subpath);
    // Convert appended subpath segments to strings.
    // this._atSegments are already guaranteed to be strings.
    for (var i = basePathLength; i < segments.length; i++) {
      segments[i] = segments[i].toString();
    }
    return segments;
  }
  if (typeof subpath._pathSegments === 'function') return subpath._pathSegments();
  throw new Error('Invalid subpath:', subpath);
};

Model.prototype.isPath = function(subpath) {
  return this.path(subpath) != null;
};

/**
 * Creates a child model at a given absolute path.
 *
 * @param {string | Array<string | number>} [path] optional absolute path
 * @returns {ChildModel}
 */
Model.prototype.scope = function(path) {
  if (Array.isArray(path)) {
    var stringSegments = path.map(function(segment) {
      return segment.toString();
    });
    return this._childFromSegments(stringSegments);
  }
  var model = this._child();
  model._at = path;
  model._atSegments = path ? path.split() : [];
  return model;
};

Model.prototype._childFromSegments = function(pathSegments) {
  var model = this._child();
  model._atSegments = pathSegments;
  model._at = model._atSegments.join('.');
  return model;
};

/**
 * Creates a child model scoped to a relative subpath of this model's path.
 *
 * Example:
 *     var user = model.at('users.1');
 *     user.set('username', 'brian');
 *     user.on('push', 'todos', function(todo) {
 *       // ...
 *     });
 *
 * @param {string | Array<string | number>} [subpath] optional relative subpath
 * @returns {ChildModel}
 */
Model.prototype.at = function(subpath) {
  if (Array.isArray(subpath)) {
    var pathSegments = this._pathSegments(subpath);
    return this._childFromSegments(pathSegments);
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

function isArrayOrModel(path) {
  return Array.isArray(path) ||
      (path && typeof path._pathSegments === 'function');
}
