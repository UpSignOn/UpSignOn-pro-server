import { db } from './db';

export const getAdminEmailsForBank = async (bankId: number): Promise<string[]> => {
  const bankAdmins = await db.query(
    'SELECT email FROM admins AS a INNER JOIN admin_banks AS ag ON ag.admin_id = a.id WHERE NOT a.is_superadmin AND ag.bank_id=$1',
    [bankId],
  );
  if (bankAdmins.rowCount != null && bankAdmins.rowCount > 0) {
    const adminEmails = bankAdmins.rows.map((admin) => admin.email);
    return adminEmails;
  } else {
    const superAdmins = await db.query('SELECT email FROM admins WHERE is_superadmin', []);
    const adminEmails = superAdmins.rows.map((admin) => admin.email);
    return adminEmails;
  }
};
