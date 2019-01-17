'use strict'

const { Action, api } = require('actionhero')


class SmartAgentHemCreate extends Action {
  constructor() {
    super()
    this.name = 'smart-agents/hem/twin-create'
    this.description = 'Creates a digital twin contract.'
    this.inputs = { }
    this.outputExample = { }
  }

  async run({ params, response }) {
    try {
      response.contractId = await api.smartAgentHem.createTwin()
      response.status = 'success'

    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}

module.exports = {
  SmartAgentHemCreate
}
