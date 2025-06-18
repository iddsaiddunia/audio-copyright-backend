import app from './app';
import { SystemSetting } from './models/systemSetting';
import sequelize from './config/database';
import { seedSystemSettingsIfNeeded } from './models/systemSetting';

const PORT = process.env.PORT || 4000;

// Sync database and start server (auto-migrate in dev)
sequelize.sync({ alter: true }).then(async () => {
  // Only seed after all tables are created
  await seedSystemSettingsIfNeeded();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}`);
  });
}).catch(err => {
  // eslint-disable-next-line no-console
  console.error('Failed to sync database:', err);
  process.exit(1);
});
