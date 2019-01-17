'use strict'

const {
  api,
  Initializer,
} = require('actionhero')

// configuration shortcut
const config = api.config.smartAgentHem


module.exports = class SmartAgentHemInitializer extends Initializer {
  constructor() {
    super()
    this.name = 'hem'
    this.loadPriority = 4100
    this.startPriority = 4100
    this.stopPriority = 4100
  }

  async initialize() {
    if (config.disabled) {
      return
    }

    // specialize from blockchain smart agent library
    class SmartAgentHem extends api.smartAgents.SmartAgent {
      async initialize () {
        await super.initialize()
      }
    }

    // start the initialization code
    const smartAgentHem = new SmartAgentHem(config)
    await smartAgentHem.initialize()

    // objects and values used outside initializer
    api.smartAgentHem = smartAgentHem
  }
}
