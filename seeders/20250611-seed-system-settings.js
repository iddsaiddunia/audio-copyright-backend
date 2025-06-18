require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Only seed these settings (not secrets)
    const settings = [
      {
        key: 'COPYRIGHT_PAYMENT_AMOUNT',
        value: process.env.COPYRIGHT_PAYMENT_AMOUNT || '50000',
        description: 'Default copyright registration payment amount (TZS)',
        type: 'number'
      },
      {
        key: 'TRANSFER_PAYMENT_AMOUNT',
        value: process.env.TRANSFER_PAYMENT_AMOUNT || '25000',
        description: 'Default transfer payment amount (TZS)',
        type: 'number'
      },
      {
        key: 'LICENSING_MIN_AMOUNT',
        value: process.env.LICENSING_MIN_AMOUNT || '10000',
        description: 'Minimum licensing payment amount (TZS)',
        type: 'number'
      },
      {
        key: 'COSOTA_COMMISSION_PERCENTAGE',
        value: process.env.COSOTA_COMMISSION_PERCENTAGE || '10',
        description: 'COSOTA commission percentage',
        type: 'number'
      },
      {
        key: 'AUDIO_SIMILARITY_THRESHOLD',
        value: process.env.AUDIO_SIMILARITY_THRESHOLD || '0.98',
        description: 'Audio similarity threshold (0.0-1.0)',
        type: 'number'
      },
      {
        key: 'LYRICS_SIMILARITY_THRESHOLD',
        value: process.env.LYRICS_SIMILARITY_THRESHOLD || '0.8',
        description: 'Lyrics similarity threshold (0.0-1.0)',
        type: 'number'
      }
    ];
    await queryInterface.bulkInsert('system_settings', settings.map(s => ({
      ...s,
      id: Sequelize.literal('(UUID())')
    })));
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('system_settings', null, {});
  }
};
