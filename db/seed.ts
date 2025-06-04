import { db } from './index';
import { users, childProfiles, progressEntries, moduleSettings } from './schema';

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Add seed data here if needed
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();