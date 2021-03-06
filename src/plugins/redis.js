'use strict'

const tx = require('./util/redis')

function createWrapInternalSendCommand (tracer, config) {
  return function wrapInternalSendCommand (internalSendCommand) {
    return function internalSendCommandWithTrace (options) {
      const span = startSpan(tracer, config, this, options.command, options.args)

      options.callback = tx.wrap(span, options.callback)

      return internalSendCommand.call(this, options)
    }
  }
}

function createWrapSendCommand (tracer, config) {
  return function wrapSendCommand (sendCommand) {
    return function sendCommandWithTrace (command, args, callback) {
      const span = startSpan(tracer, config, this, command, args)

      if (callback) {
        callback = tx.wrap(span, callback)
      } else if (args) {
        args[(args.length || 1) - 1] = tx.wrap(span, args[args.length - 1])
      } else {
        args = [tx.wrap(span)]
      }

      return sendCommand.call(this, command, args, callback)
    }
  }
}

function startSpan (tracer, config, client, command, args) {
  const db = client.selected_db
  const connectionOptions = client.connection_options || client.connection_option || {}
  const span = tx.instrument(tracer, config, db, command, args)

  tx.setHost(span, connectionOptions.host, connectionOptions.port)

  return span
}

module.exports = [
  {
    name: 'redis',
    versions: ['^2.6'],
    patch (redis, tracer, config) {
      this.wrap(redis.RedisClient.prototype, 'internal_send_command', createWrapInternalSendCommand(tracer, config))
    },
    unpatch (redis) {
      this.unwrap(redis.RedisClient.prototype, 'internal_send_command')
    }
  },
  {
    name: 'redis',
    versions: ['>=0.12 <2.6'],
    patch (redis, tracer, config) {
      this.wrap(redis.RedisClient.prototype, 'send_command', createWrapSendCommand(tracer, config))
    },
    unpatch (redis) {
      this.unwrap(redis.RedisClient.prototype, 'send_command')
    }
  }
]
