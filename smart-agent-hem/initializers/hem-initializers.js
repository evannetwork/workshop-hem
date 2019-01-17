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
      /**
       * creates a digital twin, registers its address in ENS
       *
       * @return     {Promise<string>}  accountId of new twin
       */
      async createTwin() {
        api.log('creating new digital twin', 'debug')
        const contract = await this.runtime.dataContract.create(
          'testdatacontract',
          config.ethAccount,
          null,
          {
            "public": {
              "name": "EX8000-6",
              "description": "Digital Twin for EX8000-6",
              "version": "0.1.0",
              "author": "evan GmbH",
            }
          },
        )

        api.log(`registering twin ${contract.options.address} at ENS address ${config.ensAddress}`, 'debug')
        await this.runtime.nameResolver.setAddress(
          config.ensAddress,
          contract.options.address,
          config.ethAccount,
        )

        return contract.options.address
      }

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
