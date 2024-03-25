import { db } from './db';

export const getAdminEmailsForGroup = async (groupId: number): Promise<string[]> => {
  const admins = await db.query(
    'SELECT email FROM admins AS a LEFT JOIN admin_groups AS ag ON ag.admin_id = a.id WHERE a.is_superadmin OR ag.group_id=$1',
    [groupId],
  );
  const adminEmails = admins.rows.map((admin) => admin.email);
  return adminEmails;
};
