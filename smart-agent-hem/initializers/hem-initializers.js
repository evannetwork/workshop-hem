'use strict'

const {
  ModificationType,
  PropertyType,
} = require('@evan.network/api-blockchain-core')

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

        await this.updateTwin()

        return contract.options.address
      }

      /**
       * initialize SmartAgentHem instance, must be called before using the agent
       *
       * @return     {Promise<void>}  resolved when done
       */
      async initialize () {
        await super.initialize()
      }

      /**
       * update contract structure of digital twin
       *
       * @return     {Promise<void>}  resolved when done
       */
      async updateTwin() {
        api.log(`starting updates for twin "${config.ensAddress}"`, 'debug')
        await this._updateTwin1()
      }

      /**
       * apply first update:
       * - add field 'metadata' to description
       * - allow field 'metadata' to be set by contract owner group
       * - set value for metadata
       * - update version in description
       *
       * @return     {Promise<void>}  resolved when done
       */
      async _updateTwin1() {
        const twinAddress = await this.runtime.nameResolver.getAddress(config.ensAddress)
        const description = await this.runtime.description.getDescription(twinAddress)

        // check version of twin before applying updates
        const versionInfo = description.public.version.split('.')
        const version = parseInt(versionInfo[2], 10)
        if (version < 1) {
          api.log('version < 1, applying update')

          // add field 'metadata' to description, then update description in blockchain
          description.public.dataSchema = {
            'metadata': {
              '$id': 'metadata_schema',
              'type': 'object',
              'additionalProperties': false,
              'properties': {
                'power':  { 'type': 'string' },
                'length': { 'type': 'string' },
                'weight': { 'type': 'string' },
              }
            }
          }
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            config.ethAccount,
          )

          // allow field 'metadata' to be set by contract owner group
          await this.runtime.rightsAndRoles.setOperationPermission(
            twinAddress,                 // contract to be updated
            config.ethAccount,           // account, that can change permissions
            0,                           // role id, uint8 value
            'metadata',                  // name of the object
            PropertyType.Entry,          // what type of element is modified
            ModificationType.Set,        // type of the modification
            true,                        // grant this capability
          )

          // set value for metadata
          await this.runtime.dataContract.setEntry(
            twinAddress,
            'metadata',
            {
              power: '292.7t',
              length: '25m',
              weight: '811.0t',
            },
            config.ethAccount,
            true,
            false,
            'unencrypted',
          )

          // update version in description
          description.public.version = '0.1.1'
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            config.ethAccount,
          )
        } else {
          api.log('version >= 1, skipping update', 'debug')
        }
      }
    }

    // start the initialization code
    const smartAgentHem = new SmartAgentHem(config)
    await smartAgentHem.initialize()

    // objects and values used outside initializer
    api.smartAgentHem = smartAgentHem
  }
}
