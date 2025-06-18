"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "verificationDocumentType", {
      type: Sequelize.ENUM("passport", "national_id", "driving_license"),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("users", "verificationDocumentUrl", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "verificationDocumentType");
    await queryInterface.removeColumn("users", "verificationDocumentUrl");
    // Remove ENUM type if needed
    if (queryInterface.sequelize.options.dialect === "postgres") {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_users_verificationDocumentType\";");
    }
  },
};
