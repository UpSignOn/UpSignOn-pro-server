import { db } from '../../helpers/db';

export const isInstanceStopped = async (bankId: Number): Promise<Boolean> => {
  const res = await db.query('SELECT stop_this_instance FROM banks WHERE id=$1', [bankId]);
  if (res?.rows?.[0].stop_this_instance) {
    return true;
  }
  return false;
};
