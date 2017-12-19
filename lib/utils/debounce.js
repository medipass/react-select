'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = debounce;
/* global setTimeout, clearTimeout */

function debounce(fn) {
  var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var lastCallAt = void 0;
  var deferred = void 0;
  var timer = void 0;
  var pendingArgs = [];
  return function debounced() {
    var currentWait = getWait(wait);
    var currentTime = new Date().getTime();

    var isCold = !lastCallAt || currentTime - lastCallAt > currentWait;

    lastCallAt = currentTime;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (isCold && options.leading) {
      return options.accumulate ? fn.call(this, [args]).then(function (result) {
        return result[0];
      }) : fn.call.apply(fn, [this].concat(args));
    }

    if (deferred) {
      clearTimeout(timer);
    } else {
      deferred = defer();
    }

    pendingArgs.push(args);
    timer = setTimeout(flush.bind(this), currentWait);

    if (options.accumulate) {
      var argsIndex = pendingArgs.length - 1;
      return deferred.promise.then(function (results) {
        return results[argsIndex];
      });
    }

    return deferred.promise;
  };

  function flush() {
    var thisDeferred = deferred;
    clearTimeout(timer);
    if (options.accumulate) {
      fn.call(this, pendingArgs).then(function (res) {
        return thisDeferred.resolve(res);
      }, function (err) {
        return thisDeferred.reject(err);
      });
    } else {
      fn.apply(this, pendingArgs[pendingArgs.length - 1]).then(function (res) {
        return thisDeferred.resolve(res);
      }, function (err) {
        return thisDeferred.reject(err);
      });
    }

    pendingArgs = [];
    deferred = null;
  }
};

function getWait(wait) {
  return typeof wait === 'function' ? wait() : wait;
}

function defer() {
  var deferred = {};
  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}