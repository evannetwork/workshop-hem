'use strict'

const abiDecoder = require('abi-decoder')

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
        await this._listenToTransactions()
      }

      /**
       * update contract structure of digital twin
       *
       * @return     {Promise<void>}  resolved when done
       */
      async updateTwin() {
        api.log(`starting updates for twin "${config.ensAddress}"`, 'debug')
        await this._updateTwin1()
        await this._updateTwin2()
        await this._updateTwin3()
      }

      /**
       * substribe to updates for digital twin
       *
       * @return     {Promise<void>}  resolved when done
       */
      async _listenToTransactions() {
        api.log('subscribing to digital twin updates', 'debug')
        abiDecoder.addABI(JSON.parse(this.runtime.contractLoader.contracts.DataContract.interface))
        api.eth.blockEmitter.on('data', async (block) => {
          for (let tx of block.transactions) {
            const input = abiDecoder.decodeMethod(tx.input)
            if (input) {
              // check if target list is 'usagelog'
              if (input.params[0].value[0] ===
                  this.runtime.nameResolver.soliditySha3('usagelog')) {
                // retrieve all entries, starting with newest entry
                const entries = await this.runtime.dataContract.getListEntries(
                  tx.to,
                  'usagelog',
                  config.ethAccount,
                  true,
                  true,
                  10,
                  0,
                  true,
                )
                // check if last two entries are a pair of 'stopped' and 'started' entries 
                if (entries.length > 1 &&
                  entries[0].state === 'stopped' &&
                  entries[1].state === 'started') {
                  api.log('received usage log, updating workinghours')

                  // get current value for workinghours
                  const workinghours = await this.runtime.dataContract.getEntry(
                    tx.to,
                    'workinghours',
                    config.ethAccount,
                    true,
                    false,
                  )

                  // calculate last run time
                  const diff = parseInt(entries[0].time, 10) -
                    parseInt(entries[1].time, 10)

                  // update workinghours
                  await this.runtime.dataContract.setEntry(
                    tx.to,
                    'workinghours',
                    workinghours + diff,
                    config.ethAccount,
                    true,
                    false,
                    'unencrypted',
                  )
                }
              }
            }
          }
        })
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

      /**
       * apply second update:
       * - add field 'usagelog' to description
       * - allow field 'usagelog' to be set by contract member group
       * - invite configured iot device to contract
       * - share encryption key for contract with configured iot device
       * - update version in description
       *
       * @return     {Promise<void>}  resolved when done
       */
      async _updateTwin2() {
        const twinAddress = await this.runtime.nameResolver.getAddress(config.ensAddress)
        const description = await this.runtime.description.getDescription(twinAddress)

        const versionInfo = description.public.version.split('.')
        const version = parseInt(versionInfo[2], 10)
        if (version < 2) {
          api.log('version < 2, applying update')

          // add field 'usagelog' to description
          description.public.dataSchema.usagelog = {
            '$id': 'usagelog_schema',
            'type': 'object',
            'additionalProperties': false,
            'properties': {
              'time':  { 'type': 'string' },
              'state': { 'type': 'string' },
            }
          }
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            config.ethAccount,
          )

          // allow field 'usagelog' to be set by contract member group
          await this.runtime.rightsAndRoles.setOperationPermission(
            twinAddress,                 // contract to be updated
            config.ethAccount,           // account, that can change permissions
            1,                           // role id, uint8 value
            'usagelog',                  // name of the object
            PropertyType.ListEntry,      // what type of element is modified
            ModificationType.Set,        // type of the modification
            true,                        // grant this capability
          )

          // invite configured iot device to contract
          await this.runtime.dataContract.inviteToContract(
            null,
            twinAddress,
            config.ethAccount,
            config.toInvite,
          )

          // share encryption key for contract with configured iot device
          const key = await this.runtime.sharing.getKey(
            twinAddress,
            config.ethAccount,
            '*',
          )
          await this.runtime.sharing.addSharing(
            twinAddress,
            config.ethAccount,
            config.toInvite,
            '*',
            0,
            key,
          )
          
          // update version in description
          description.public.version = '0.1.2'
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            config.ethAccount,
          )
        } else {
          api.log('version >= 2, skipping update', 'debug')
        }
      }

      /**
       * apply third update:
       * - add field 'workinghours' to description
       * - allow field 'workinghours' to be set by contract owner group
       * - set initial value for workinghours --> 0
       * - update version in description
       *
       * @return     {Promise<void>}  resolved when done
       */
      async _updateTwin3() {
        const twinAddress = await this.runtime.nameResolver.getAddress(config.ensAddress)
        const description = await this.runtime.description.getDescription(twinAddress)

        const versionInfo = description.public.version.split('.')
        const version = parseInt(versionInfo[2], 10)
        if (version < 3) {
          api.log('version < 3, applying update')

          // add field 'workinghours' to description
          description.public.dataSchema = {
            'workinghours': {
              '$id': 'workinghours_schema',
              'type': 'number',
            }
          }
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            config.ethAccount,
          )

          // allow field 'workinghours' to be set by contract owner group
          await this.runtime.rightsAndRoles.setOperationPermission(
            twinAddress,                 // contract to be updated
            config.ethAccount,           // account, that can change permissions
            0,                           // role id, uint8 value
            'workinghours',              // name of the object
            PropertyType.Entry,          // what type of element is modified
            ModificationType.Set,        // type of the modification
            true,                        // grant this capability
          )

          // set initial value for workinghours --> 0
          await this.runtime.dataContract.setEntry(
            twinAddress,
            'workinghours',
            0,
            config.ethAccount,
            true,
            false,
            'unencrypted',
          )

          // update version in description
          description.public.version = '0.1.3'
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            config.ethAccount,
          )
        } else {
          api.log('version >= 3, skipping update', 'debug')
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
