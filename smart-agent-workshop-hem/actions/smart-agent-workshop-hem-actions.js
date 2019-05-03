'use strict'
const { Action, api } = require('actionhero')

const rxEtherAccount = /^0x[\da-fA-F]{40}/

class SmartAgentWorkshopHemTwinCreate extends Action {
  constructor () {
    super()
    this.name = 'smart-agents/workshop-hem/twin/create'
    this.description = 'I create a digital twin'
    this.inputs = {
      // accountId: {
      //   required: true,
      //   validator: this.accountValidator
      // }
    }
    this.outputExample = { }
  }

  accountValidator (param) {
    if (!param.match(rxEtherAccount)) {
      throw new Error('not a valid account address')
    }
  }

  async run ({ params, response }) {
    try {
      // a signed message can be given to validate account
      // for signing messags see https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
      // var srcId = await api.eth.web3.eth.accounts.recover(
      //   api.config.smartAgentWorkshopHem.sign_message, params.srcSignature);
      // if(srcId !== params.srcId) throw new Error("No verified Account.")

      await api.smartAgentWorkshopHem.createTwin()

      response.status = 'success'
    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}

class SmartAgentWorkshopHemTwinUpdate extends Action {
  constructor () {
    super()
    this.name = 'smart-agents/workshop-hem/twin/update'
    this.description = 'I update a digital twin'
    this.inputs = {
      // accountId: {
      //   required: true,
      //   validator: this.accountValidator
      // }
    }
    this.outputExample = { }
  }

  accountValidator (param) {
    if (!param.match(rxEtherAccount)) {
      throw new Error('not a valid account address')
    }
  }

  async run ({ params, response }) {
    try {
      // a signed message can be given to validate account
      // for signing messags see https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
      // var srcId = await api.eth.web3.eth.accounts.recover(
      //   api.config.smartAgentWorkshopHem.sign_message, params.srcSignature);
      // if(srcId !== params.srcId) throw new Error("No verified Account.")

      await api.smartAgentWorkshopHem.updateTwin()

      response.status = 'success'
    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}

class SmartAgentWorkshopHemTwinUsagelogGet extends Action {
  constructor () {
    super()
    this.name = 'smart-agents/workshop-hem/twin/usagelog/get'
    this.description = 'I retrieve a usagelog for a twin'
    this.inputs = {
      // accountId: {
      //   required: true,
      //   validator: this.accountValidator
      // }
    }
    this.outputExample = { }
  }

  accountValidator (param) {
    if (!param.match(rxEtherAccount)) {
      throw new Error('not a valid account address')
    }
  }

  async run ({ params, response }) {
    try {
      // a signed message can be given to validate account
      // for signing messags see https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
      // var srcId = await api.eth.web3.eth.accounts.recover(
      //   api.config.smartAgentWorkshopHem.sign_message, params.srcSignature);
      // if(srcId !== params.srcId) throw new Error("No verified Account.")

      response.result = await api.smartAgentWorkshopHem.getUsagelog()
      response.status = 'success'
    } catch (ex) {
      api.log(ex)
      response.status = 'error'
      response.error = ex
    }
  }
}

module.exports = {
  SmartAgentWorkshopHemTwinCreate,
  SmartAgentWorkshopHemTwinUpdate,
  SmartAgentWorkshopHemTwinUsagelogGet
}
