import { db } from '../../helpers/db';

export const isInstanceStopped = async (groupId: Number): Promise<Boolean> => {
  const res = await db.query('SELECT stop_this_instance FROM groups WHERE id=$1', [groupId]);
  if (res?.rows?.[0].stop_this_instance) {
    return true;
  }
  return false;
};
