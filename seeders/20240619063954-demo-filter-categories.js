'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) 
  {
    await queryInterface.bulkInsert('FilterCategories', [
      {
        name: 'Location',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Outfit',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Activity',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pose',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Hairstyle',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Accessories',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mood/Theme',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Skin Exposure',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
