'use strict'

const abiDecoder = require('abi-decoder')

const {
  ModificationType,
  PropertyType
} = require('@evan.network/api-blockchain-core')
const {
  api,
  Initializer
} = require('actionhero')

module.exports = class SmartAgentWorkshopHemInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'workshop-hem'
    this.loadPriority = 4100
    this.startPriority = 4100
    this.stopPriority = 4100
  }

  async initialize () {
    if (api.config.smartAgentWorkshopHem.disabled) {
      return
    }

    // specialize from blockchain smart agent library
    class SmartAgentWorkshopHem extends api.smartAgents.SmartAgent {
      async initialize () {
        await super.initialize()
      }

      async createTwin () {
        const definition = {
          'public': {
            'name': 'Hyundai R800LC-7A',
            'description': 'Digital Twin for Hyundai R800LC-7A',
            'version': '0.1.0',
            'author': 'evan GmbH'
          }
        }
        const contract = await this.runtime.dataContract.create(
          'testdatacontract',
          this.config.ethAccount,
          null,
          definition
        )
        await this.runtime.nameResolver.setAddress(
          this.config.ensDomain,
          contract.options.address,
          this.config.ethAccount
        )
      }

      async getUsagelog () {
        const twinAddress = await this.runtime.nameResolver.getAddress(
          this.config.ensDomain)
        return this.runtime.dataContract.getListEntries(
          twinAddress,
          'usagelog',
          this.config.ethAccount,
          true,
          true,
          10,
          0,
          true
        )
      }

      async listenToTransactions () {
        api.log('subscribing to digital twin updates', 'debug')
        const twinAddress = await this.runtime.nameResolver.getAddress(
          this.config.ensDomain)
        const issuerIdentity = (await this.runtime.verifications.getIdentityForAccount(
          this.config.trustedIssuer)).options.address
        api.log(`trusting issuer ${issuerIdentity}`)
        abiDecoder.addABI(JSON.parse(this.runtime.contractLoader.contracts.DataContract.interface))
        api.eth.blockEmitter.on('data', async (block) => {
          const filteredTransaction = block.transactions
            .filter((tx) => tx.to === twinAddress)
          const trustedTransactions = []
          for (let i = 0; i < filteredTransaction.length; i++) {
            // get all verifications for 'calibrated'
            const verifications = await this.runtime.verifications.getVerifications(
              filteredTransaction[i].from,
              '/calibrated'
            )
            console.dir(verifications)
            const filteredVerifications = verifications
              .filter(ver => ver.issuer === issuerIdentity)
              .filter(ver => ver.valid)
              .filter(ver => !ver.expired)
              .filter(ver => !ver.rejectReason)
            if (filteredVerifications.length) {
              api.log('received trusted verification')
              trustedTransactions.push(filteredTransaction[i])
            }
          }
          const inputs = trustedTransactions.map(
            tx => abiDecoder.decodeMethod(tx.input))
          for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].params[0].value[0] ===
                this.runtime.nameResolver.soliditySha3('usagelog')) {
              const usagelog = await this.getUsagelog()
              if (usagelog.length > 1 &&
                  usagelog[0].state === 'stopped' &&
                  usagelog[1].state === 'started') {
                const diff =
                  parseInt(usagelog[0].time, 10) -
                  parseInt(usagelog[1].time, 10)
                api.log(`calculated difference: ${diff}`)
                let workinghours = await this.runtime.dataContract.getEntry(
                  twinAddress,
                  'workinghours',
                  this.config.ethAccount,
                  true,
                  false
                )

                api.log(`old workinghours: ${workinghours}`)
                workinghours = (workinghours || 0) + diff
                api.log(`new workinghours: ${workinghours}`)

                await this.runtime.dataContract.setEntry(
                  twinAddress,
                  'workinghours',
                  workinghours,
                  this.config.ethAccount,
                  true,
                  false,
                  'unencrypted'
                )
              } else {
                api.log('received tx, but not matching condition')
              }
            }
          }
        })
      }

      async updateTwin () {
        await this.updateTwin1()
        await this.updateTwin2()
        await this.updateTwin3()
      }

      async updateTwin1 () {
        const twinAddress = await this.runtime.nameResolver.getAddress(
          this.config.ensDomain)

        const description = await this.runtime.description.getDescription(
          twinAddress)

        if (description.public.version === '0.1.0') {
          // perform update
          api.log(`updating twin "${twinAddress}" to version 0.2.0`)

          // add new metadata field to twin
          await this.runtime.rightsAndRoles.setOperationPermission(
            twinAddress, // contract to be updated
            this.config.ethAccount, // account, that can change permissions
            0, // role id, uint8 value, owner
            'metadata', // name of the object
            PropertyType.Entry, // what type of element is modified
            ModificationType.Set, // type of the modification
            true // grant this capability
          )

          const metadata = {
            power: '45.2t',
            length: '13.10m',
            weight: '82.3t'
          }

          await this.runtime.dataContract.setEntry(
            twinAddress,
            'metadata',
            metadata,
            this.config.ethAccount,
            true,
            false,
            'unencrypted'
          )

          description.public.version = '0.2.0'
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            this.config.ethAccount
          )
        }
      }

      async updateTwin2 () {
        const twinAddress = await this.runtime.nameResolver.getAddress(
          this.config.ensDomain)

        const description = await this.runtime.description.getDescription(
          twinAddress)

        if (description.public.version === '0.2.0') {
          // perform update
          api.log(`updating twin "${twinAddress}" to version 0.3.0`)

          // add usagelog list
          // add new metadata field to twin
          await this.runtime.rightsAndRoles.setOperationPermission(
            twinAddress, // contract to be updated
            this.config.ethAccount, // account, that can change permissions
            1, // role id, uint8 value, member
            'usagelog', // name of the object
            PropertyType.ListEntry, // what type of element is modified
            ModificationType.Set, // type of the modification
            true // grant this capability
          )

          // add other account to contract
          await this.runtime.dataContract.inviteToContract(
            null,
            twinAddress,
            this.config.ethAccount,
            this.config.customerAccount
          )

          // provide keys to contract to other account
          const dataKey = await this.runtime.sharing.getKey(
            twinAddress,
            this.config.ethAccount,
            '*'
          )
          await this.runtime.sharing.addSharing(
            twinAddress,
            this.config.ethAccount,
            this.config.customerAccount,
            '*',
            0,
            dataKey
          )

          // update description with version number and data schema
          description.public.version = '0.3.0'
          description.public.dataSchema = {
            usagelog: {
              '$id': 'usagelog_schema',
              'type': 'object',
              'additionalProperties': false,
              'properties': {
                'time': { 'type': 'string' },
                'state': { 'type': 'string' }
              }
            }
          }
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            this.config.ethAccount
          )
        }
      }

      async updateTwin3 () {
        const twinAddress = await this.runtime.nameResolver.getAddress(
          this.config.ensDomain)

        const description = await this.runtime.description.getDescription(
          twinAddress)

        if (description.public.version === '0.3.0') {
          // perform update
          api.log(`updating twin "${twinAddress}" to version 0.4.0`)

          // add new workinghours field to twin
          await this.runtime.rightsAndRoles.setOperationPermission(
            twinAddress, // contract to be updated
            this.config.ethAccount, // account, that can change permissions
            0, // role id, uint8 value, owner
            'workinghours', // name of the object
            PropertyType.Entry, // what type of element is modified
            ModificationType.Set, // type of the modification
            true // grant this capability
          )

          await this.runtime.dataContract.setEntry(
            twinAddress,
            'workinghours',
            0,
            this.config.ethAccount,
            true,
            false,
            'unencrypted'
          )

          description.public.version = '0.4.0'
          await this.runtime.description.setDescription(
            twinAddress,
            description,
            this.config.ethAccount
          )
        }
      }
    }

    // start the initialization code
    const smartAgentWorkshopHem = new SmartAgentWorkshopHem(api.config.smartAgentWorkshopHem)
    await smartAgentWorkshopHem.initialize()
    await smartAgentWorkshopHem.listenToTransactions()

    // objects and values used outside initializer
    api.smartAgentWorkshopHem = smartAgentWorkshopHem
  }
}
