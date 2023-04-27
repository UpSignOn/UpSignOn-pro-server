import { db } from './db';

export async function cleanOldRevokedDevices() {
  await db.query(
    "DELETE FROM user_devices WHERE authorization_status='REVOKED_BY_USER' AND revocation_date < (current_timestamp(0) - interval '1 month')",
  );
}
