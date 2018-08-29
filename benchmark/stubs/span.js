'use strict'

const Uint64BE = require('int64-buffer').Uint64BE
const Buffer = require('safe-buffer').Buffer
const buffer = Buffer.alloc(8)
const id = new Uint64BE(buffer, 0, 0x12345678, 0x12345678)

const span = {
  tracer: () => ({
    _service: 'service'
  }),
  context: () => ({
    traceId: id,
    spanId: id,
    parentId: id,
    trace: {
      started: [span, span],
      finished: [span, span]
    }
  }),
  _operationName: 'operation',
  _tags: {
    'resource.name': '/resource',
    'span.type': 'web'
  },
  _startTime: 1500000000000.123456,
  _duration: 100
}

module.exports = span