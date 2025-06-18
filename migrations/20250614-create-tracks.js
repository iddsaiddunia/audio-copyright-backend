// Migration for tracks table
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tracks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      artistId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'copyrighted'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fingerprint: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lyrics: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      collaborators: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isAvailableForLicensing: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      licenseFee: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      licenseTerms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      duration: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      blockchainTx: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('tracks');
  }
};
