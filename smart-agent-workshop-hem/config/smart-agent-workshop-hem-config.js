exports['default'] = {
  ethAccounts: {
    '0x5826021dFD9131481c3665A9A5d2Db37701D9Bf5': '3cb487704d18fc0ad919bf64c419ac13685eaebed73240a03ea8e78bad8d1d7e'
  },
  encryptionKeys: {
    '0x05f53c4b630acfabca8f7b58eedf3a39c749963d7911eddd0083684da8dce2a6': '7e6680a6f96311fea1ec20dc4f8fdf3ad6dfcd2cdcaabf527e539c04295227d6',
    '0x62ebd1817ca0b89b2c0db33f0e7714cdfe51e9581b963ffc9ef8cf971865691b': '7e6680a6f96311fea1ec20dc4f8fdf3ad6dfcd2cdcaabf527e539c04295227d6'
  },
  smartAgentWorkshopHem: (api) => {
    return {
      disabled: false,
      name: 'workshop-hem',
      ethAccount: '0x5826021dFD9131481c3665A9A5d2Db37701D9Bf5',
      ensDomain: 'hem0429.fifs.registrar.test.evan',
      customerAccount: '0x35642819b4F0fB9A21F413E9dceD5A825f308A44',
      trustedIssuer: '0x755a4b994d5BC962eC442009112099c1145D391d'
    }
  }
}
