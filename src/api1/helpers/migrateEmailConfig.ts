import { db } from '../../helpers/db';

export async function migrateEmailConfig() {
  if (process.env.EMAIL_HOST) {
    const settingsRes = await db.query("SELECT value FROM settings WHERE key='EMAIL_CONFIG'");
    if (settingsRes.rowCount === 0) {
      await db.query("INSERT INTO settings (key, value) VALUES ('EMAIL_CONFIG', $1)", [
        {
          EMAIL_HOST: process.env.EMAIL_HOST,
          EMAIL_PORT: process.env.EMAIL_PORT ? Number.parseInt(process.env.EMAIL_PORT) : 587,
          EMAIL_USER: process.env.EMAIL_USER,
          EMAIL_PASS: process.env.EMAIL_PASS,
          EMAIL_SENDING_ADDRESS: process.env.EMAIL_USER,
          EMAIL_ALLOW_INVALID_CERTIFICATE:
            // @ts-ignore
            process.env.EMAIL_ALLOW_INVALID_CERTIFICATE === true ||
            process.env.EMAIL_ALLOW_INVALID_CERTIFICATE === 'true',
        },
      ]);
    }
    console.log(
      "\n\nLa configuration des emails a été déplacée vers le dashboard. Nous vous conseillons d'effacer les variables EMAIL_* de votre fichier .env\n\n",
    );
  }
}
