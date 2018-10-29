'use strict'

function createWrapThen (tracer, config) {
  return function wrapThen (then) {
    return function thenWithTrace (didFulfill, didReject) {
      arguments[0] = wrapCallback(tracer, didFulfill)
      arguments[1] = wrapCallback(tracer, didReject)

      return then.apply(this, arguments)
    }
  }
}

function wrapCallback (tracer, callback) {
  const scope = tracer.scopeManager().active()

  return function () {
    tracer.scopeManager().activate(scope.span())
    return callback.apply(this, arguments)
  }
}

module.exports = [
  {
    name: 'bluebird',
    versions: ['3.x'],
    patch (Promise, tracer, config) {
      this.wrap(Promise.prototype, '_then', createWrapThen(tracer, config))
      this.wrap(Promise.prototype, '_addCallbacks', createWrapThen(tracer, config))
    },
    unpatch (Promise) {
      this.unwrap(Promise.prototype, '_then')
      this.unwrap(Promise.prototype, '_addCallbacks')
    }
  }
]
