// Migration for ownership_transfers table
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ownership_transfers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      trackId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      currentOwnerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      newOwnerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('requested', 'approved', 'published'),
        allowNull: false,
        defaultValue: 'requested',
      },
      paymentId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      blockchainTx: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      certificateUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      requestedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      publishedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('ownership_transfers');
  }
};
