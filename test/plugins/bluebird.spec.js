'use strict'

const agent = require('./agent')

wrapIt()

describe('Plugin', () => {
  let plugin
  let Promise
  let tracer

  describe('bluebird', () => {
    beforeEach(() => {
      plugin = require('../../src/plugins/bluebird')
      tracer = require('../..')
    })

    afterEach(() => {
      return agent.close()
    })

    describe('without configuration', () => {
      beforeEach(() => {
        return agent.load(plugin, 'bluebird')
          .then(() => {
            Promise = require('bluebird')
          })
      })

      it('should run .then() callback in the caller context', () => {
        if (process.env.DD_CONTEXT_PROPAGATION === 'false') return

        const promise = new Promise((resolve, reject) => {
          tracer.scopeManager().activate({})
          resolve()
        })

        const scope = tracer.scopeManager().activate({})

        return promise
          .then(() => {
            tracer.scopeManager().activate({})
          })
          .then(() => {
            expect(tracer.scopeManager().active()).to.equal(scope)
          })
      })
    })
  })
})
