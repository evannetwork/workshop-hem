exports['default'] = {

  ethAccounts: {
    
  "0xf638C091a1a45AEDfAFC921f27E8d65AeA8C18c4": "update config with your own account config"

  },

  encryptionKeys: {
    
  "0x0bcb1340e99e369dbd76216cd525ccada1d887aa525fa2a6fd86c667a2b64e26": "no data interaction",
  "0x870b5ac18ab729d2f50e7d9056ea8de991d0eefd935fe931879b38ee1aa33a34": "no data interaction"

  },

  smartAgentHem: (api) => {
    return {
      disabled: false,
      name: 'hem',
      ethAccount: '0xf638C091a1a45AEDfAFC921f27E8d65AeA8C18c4',
    }
  }
}
