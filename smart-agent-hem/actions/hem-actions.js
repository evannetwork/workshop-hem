'use strict'

const { Action, api } = require('actionhero')


class SmartAgentHemCreate extends Action {
  constructor() {
    super()
    this.name = 'smart-agents/hem/twin-create'
    this.description = 'Creates a digital twin contract.'
    this.inputs = {
      name: { required: true }
    }
    this.outputExample = { }
  }

  async run({ params, response }) {
    try {
      response.contractId = await api.smartAgentHem.createTwin(params.name)
      response.status = 'success'
    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}


class SmartAgentHemGet extends Action {
  constructor() {
    super()
    this.name = 'smart-agents/hem/twin-get'
    this.description = 'Gets managed digital twin contracts.'
    this.inputs = { }
    this.outputExample = { }
  }

  async run({ params, response }) {
    try {
      response.twins = await api.smartAgentHem.getManagedTwins(true)
      response.status = 'success'

    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}

class SmartAgentHemUpdate extends Action {
  constructor() {
    super()
    this.name = 'smart-agents/hem/twin-update'
    this.description = 'Updates a digital twin contract.'
    this.inputs = {
      name: { required: true }
    }
    this.outputExample = { }
  }

  async run({ params, response }) {
    try {
      response.contractId = await api.smartAgentHem.updateTwin(params.name)
      response.status = 'success'
    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}

module.exports = {
  SmartAgentHemCreate,
  SmartAgentHemGet,
  SmartAgentHemUpdate,
}
