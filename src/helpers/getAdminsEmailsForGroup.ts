import { db } from './db';

export const getAdminEmailsForGroup = async (groupId: number): Promise<string[]> => {
  const groupAdmins = await db.query(
    'SELECT email FROM admins AS a INNER JOIN admin_groups AS ag ON ag.admin_id = a.id WHERE NOT a.is_superadmin AND ag.group_id=$1',
    [groupId],
  );
  if (groupAdmins.rowCount != null && groupAdmins.rowCount > 0) {
    const adminEmails = groupAdmins.rows.map((admin) => admin.email);
    return adminEmails;
  } else {
    const superAdmins = await db.query('SELECT email FROM admins WHERE a.is_superadmin', []);
    const adminEmails = superAdmins.rows.map((admin) => admin.email);
    return adminEmails;
  }
};
