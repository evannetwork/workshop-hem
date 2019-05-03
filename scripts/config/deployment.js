/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program. If not, see http://www.gnu.org/licenses/ or
  write to the Free Software Foundation, Inc., 51 Franklin Street,
  Fifth Floor, Boston, MA, 02110-1301 USA, or download the license from
  the following URL: https://evan.network/license/

  You can be released from the requirements of the GNU Affero General Public
  License by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts
  of it on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address:
  https://evan.network/license/
*/

const externalAccounts = require('./externalAccounts');
const managedAccounts = require('./managedAccounts');

const bcConfig = {
  nameResolver: {
    ensAddress: process.env.ENS_ADDRESS || '0x937bbC1d3874961CA38726E9cD07317ba81eD2e1',
    ensResolver: process.env.ENS_RESOLVER || '0xDC18774FA2E472D26aB91deCC4CDd20D9E82047e',
    labels: {
      businessCenterRoot: process.env.BC_ROOT || 'testbc.evan',
      ensRoot: process.env.ENS_ROOT || 'evan',
      factory: 'factory',
      admin: 'admin',
      eventhub: 'eventhub',
      profile: 'profile',
      mailbox: 'mailbox'
    },
    domains: {
      root: ['ensRoot'],
      factory: ['factory', 'businessCenterRoot'],
      adminFactory: ['admin', 'factory', 'ensRoot'],
      businessCenter: ['businessCenterRoot'],
      eventhub: process.env.ENS_EVENTS || ['eventhub', 'ensRoot'],
      profile: process.env.ENS_PROFILES || ['profile', 'ensRoot'],
      profileFactory: ['profile', 'factory', 'ensRoot'],
      mailbox: process.env.ENS_MAILBOX || ['mailbox', 'ensRoot'],
      dappsDomain: 'hem0429.fifs.registrar.test',
    },
  },
  smartAgents: {
    onboarding: {
      accountId: '0x063fB42cCe4CA5448D69b4418cb89E663E71A139',
    },
  },
  alwaysAutoGasLimit: 1.1,
  ensRootOwner: '0x4a6723fC5a926FA150bAeAf04bfD673B056Ba83D',
}

let runtimeConfig = {
  web3Provider: 'wss://testcore.evan.network/ws',                              // default value
  ipfs: { host: 'ipfs.test.evan.network', port: '443', protocol: 'https' },    // default value
  minBalance: 1000000000000000000,
  bookmarkDefinitions: {
    // bookmarks as ENS domain and DBCP for bookmark
    // "sample.evan": {
    //   "name": "sample",
    //   "description": "evan.network sample bookmark",
    //   "i18n": {
    //     "description": {
    //       "en": "evan.network sample"
    //     },
    //     "name": {
    //       "en": "sample"
    //     }
    //   },
    //   // ...
    // }
  },
  bookmarks: {
    // accounts and their bookmarks as ENS domain names
    // 'race game grant legal illegal spring stable banana walk quiz vanish middle': ['sample.evan'],
  },
  businessCenters: {
    // 'sample.evan': {
    //   owner: '0x0000000000000000000000000000000000000001',
    //   members: [
    //     'race game grant legal illegal spring stable banana walk quiz vanish middle',
    //     'recycle web high fan relax ignore chalk require main about casual near',
    //   ],
    // },
  },
  contracts: {
    // // contract id or ens name
    // '0xc0274ac700000000000000000000000000000000': {
    //   // mnemonic or account id
    //   owner: 'race game grant legal illegal spring stable banana walk quiz vanish middle',
    //   members: [{
    //     // mnemonic or account id
    //     account: 'recycle web high fan relax ignore chalk require main about casual near',
    //     sharings: ['*']
    //   }],
    // }
  },
  registrar: {
    // // subdomains of this are claimable
    // domain: 'certificates.sartorius.evan',
    // // parent domain for registrar, has to be owned by 'domainParentOwner'
    // domainParent: 'sartorius.evan',
    // // owner of 'domainParent', registers and assigns 'domain' to new registrar
    // domainParentOwner: process.env.ENS_OWNER,
    // // Ethereum private key of 'domainParentOwner'
    // domainParentOwnerKey: process.env.ENS_OWNER_KEY,
  },
}

const dappConfigSwitches = {
  // deployment specific custom configurations
  url: {
    coreSmartAgent: 'https://agents.test.evan.network',
    paymentSmartAgent: 'https://payments.test.evan.network',
  },
  accounts: {
    faucetAccount: '0x4a6723fC5a926FA150bAeAf04bfD673B056Ba83D',
    paymentAgentAccount: '0xAF176885bD81D5f6C76eeD23fadb1eb0e5Fe1b1F',
    paymentChannelManagerAccount: '0x0A0D9dddEba35Ca0D235A4086086AC704bbc8C2b',
  },
  gasPrice: 20000000000,
  mainnetTexts: false
};

const evan = require('../evan.access.js')
runtimeConfig = evan.getAccountConfig(runtimeConfig, externalAccounts, managedAccounts)

module.exports = { bcConfig, runtimeConfig, dappConfigSwitches };