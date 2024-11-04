'use strict'

/**
 * Code imported from `pino-http`
 * Repo: https://github.com/pinojs/pino-http
 * License: MIT (https://raw.githubusercontent.com/pinojs/pino-http/master/LICENSE)
 */

const pino = require('pino')
const { serializersSym } = pino.symbols
const {
  FST_ERR_LOG_INVALID_DESTINATION,
} = require('./errors')

function createPinoLogger (opts) {
  if (opts.stream && opts.file) {
    throw new FST_ERR_LOG_INVALID_DESTINATION()
  } else if (opts.file) {
    // we do not have stream
    opts.stream = pino.destination(opts.file)
    delete opts.file
  }

  const prevLogger = opts.logger
  const prevGenReqId = opts.genReqId
  let logger = null

  if (prevLogger) {
    opts.logger = undefined
    opts.genReqId = undefined
    // we need to tap into pino internals because in v5 it supports
    // adding serializers in child loggers
    if (prevLogger[serializersSym]) {
      opts.serializers = Object.assign({}, opts.serializers, prevLogger[serializersSym])
    }
    logger = prevLogger.child({}, opts)
    opts.logger = prevLogger
    opts.genReqId = prevGenReqId
  } else {
    logger = pino(opts, opts.stream)
  }

  return logger
}

function createSerializers (customAttributeKeys) {
  const reqKey = customAttributeKeys.req || 'req'
  const resKey = customAttributeKeys.res || 'res'
  const errKey = customAttributeKeys.err || 'err'

  return {
    [reqKey]: function asReqValue (req) {
      return {
        method: req.method,
        url: req.url,
        version: req.headers && req.headers['accept-version'],
        host: req.host,
        remoteAddress: req.ip,
        remotePort: req.socket ? req.socket.remotePort : undefined
      }
    },
    [errKey]: pino.stdSerializers.err,
    [resKey]: function asResValue (reply) {
      return {
        statusCode: reply.statusCode
      }
    }
  }
}

module.exports = {
  createSerializers,
  createPinoLogger,
}
