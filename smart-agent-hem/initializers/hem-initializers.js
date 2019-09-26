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
       * @param      {string}           name    name of the new twin
       * @return     {Promise<string>}  accountId of new twin
       */
      async createTwin(name) {
        api.log('creating new digital twin', 'debug')
        const contract = await this.runtime.dataContract.create(
          'testdatacontract',
          config.ethAccount,
          null,
          {
            public: {
              name,
              description: `Digital Twin for ${name}`,
              version: '0.1.0',
              author: 'evan GmbH',
            }
          },
        )

        const ensAddress = `${this._sanitizeName(name)}.${config.ensParentDomain}`
        api.log(`registering twin ${contract.options.address} at ENS address ${ensAddress}`, 'debug')
        await this.runtime.nameResolver.setAddress(
          ensAddress,
          contract.options.address,
          config.ethAccount,
        )

        api.log('adding digital twin to profile', 'debug')
        await this.runtime.profile.loadForAccount(
          this.runtime.profile.treeLabels.contracts)
        await this.runtime.profile.addBcContract(
          'heavy-machines', contract.options.address, { ensAddress })
        await this.runtime.profile.storeForAccount(
          this.runtime.profile.treeLabels.contracts)

        await this.updateTwin(name)

        return contract.options.address
      }

      /**
       * retrieves digital twin contracts, managed by this server
       *
       * @param      {bool}          resolve  look up details for digital twins or return plain
       *                                      values
       * @return     {Promise<any>}  object with plain twin data or list with detailed information
       */
      async getManagedTwins(resolve) {
        api.log('retrieving digital twin from profile', 'debug')
        const bcContracts = await this.runtime.profile.getBcContracts('heavy-machines')
        if (!resolve) {
          return bcContracts
        } else {
          return Promise.all(Object.keys(bcContracts).map(address =>
            this.runtime.profile.getBcContract('heavy-machines', address)))
        }
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
       * @param      {string}         name    name of a twin
       * @return     {Promise<void>}  resolved when done
       */
      async updateTwin(name) {
        api.log(`starting updates for twin '${name}'`, 'debug')
        const ensAddress = `${this._sanitizeName(name)}.${config.ensParentDomain}`
        const twinAddress = await this.runtime.nameResolver.getAddress(ensAddress)
        await this._updateTwin1(twinAddress)
        await this._updateTwin2(twinAddress)
        await this._updateTwin3(twinAddress)

        // update list of twins to handle updates for
        let managedTwinEntries = await this.getManagedTwins()
        this.managedTwins = Object.keys(managedTwinEntries)
      }

      /**
       * substribe to updates for digital twin
       *
       * @return     {Promise<void>}  resolved when done
       */
      async _listenToTransactions() {
        api.log('subscribing to digital twin updates', 'debug')
        // get twins from profile and keep only IDs
        let managedTwinEntries = await this.getManagedTwins()
        this.managedTwins = Object.keys(managedTwinEntries || {})
        // add DataContract abi to decoder
        abiDecoder.addABI(JSON.parse(this.runtime.contractLoader.contracts.DataContract.interface))
        // load identity for trusted device (for claims checks)
        const issuerIdentity = (await this.runtime.verifications.getIdentityForAccount(
          config.trustedIssuer)).options.address
        api.eth.blockEmitter.on('data', async (block) => {
          for (let tx of block.transactions) {
            // check if target of transaction in list of contracts from profile
            if (this.managedTwins.includes(tx.to)) {
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
                    api.log(`checking claims for account '${tx.from}'`, 'debug')

                    // get all '/calibrated' claims for tx originator
                    const claims = await this.runtime.verifications.getClaims(
                      tx.from,
                      '/calibrated',
                    )

                    // check if at least one claim
                    // - is valid,
                    // - is new enough and
                    // - has been issued by trusted issuer
                    const valid = !!claims.filter(c =>
                      c.valid &&
                      c.issuer === issuerIdentity &&
                      parseInt(c.expirationDate, 10) * 1000 >= Date.now()
                    ).length

                    if (!valid) {
                      api.log(`received usage log from ${tx.from}, ` +
                        'but account doesn\'t have valid certificates', 'error')
                    } else {
                      api.log('received usage log from trusted device, updating workinghours')

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
            }
          }
        })
      }

      /**
       * sanitizes name for using in in ENS address
       *
       * @param      {string}  name    name to sanitize
       * @return     {string}  sanitized name
       */
      _sanitizeName(name) {
        return name.toLowerCase().replace(/[ .]/g, '')
      }

      /**
       * apply first update:
       * - add field 'metadata' to description
       * - allow field 'metadata' to be set by contract owner group
       * - set value for metadata
       * - update version in description
       *
       * @param      {string}         twinAddress  address of a twin
       * @return     {Promise<void>}  resolved when done
       */
      async _updateTwin1(twinAddress) {
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
       * @param      {string}         twinAddress  address of a twin
       * @return     {Promise<void>}  resolved when done
       */
      async _updateTwin2(twinAddress) {
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
       * @param      {string}         twinAddress  address of a twin
       * @return     {Promise<void>}  resolved when done
       */
      async _updateTwin3(twinAddress) {
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
