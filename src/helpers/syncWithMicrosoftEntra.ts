import { isEmailAuthorizedWithPattern } from '../api2/helpers/emailAuthorization';
import { db } from './db';
import { logError } from './logger';
import { MicrosoftGraph } from './microsoftGraph';

const getNext1pmOr1am = (): Date => {
  const nextSyncDate = new Date();
  if (nextSyncDate.getHours() < 13) {
    nextSyncDate.setHours(13); // same day at 1pm
    nextSyncDate.setMinutes(0);
    nextSyncDate.setSeconds(0);
    nextSyncDate.setMilliseconds(0);
  } else {
    nextSyncDate.setTime(Date.now() + 24 * 3600 * 1000); // next day same hour
    nextSyncDate.setHours(1); // at 1 am
    nextSyncDate.setHours(0);
    nextSyncDate.setMinutes(0);
    nextSyncDate.setSeconds(0);
    nextSyncDate.setMilliseconds(0);
  }
  return nextSyncDate;
};

export const syncPeriodicallyWithMicrosoftEntra = async (): Promise<void> => {
  performMicrosoftEntraSync();

  // call perform sync everyday at 1pm and 1am
  const nextSyncDate = getNext1pmOr1am();
  setTimeout(() => {
    performMicrosoftEntraSync();
    setInterval(performMicrosoftEntraSync, 12 * 3600 * 1000); // call it every 12 hours
  }, nextSyncDate.getTime() - Date.now()); // start the cron at the next 1pm or 1am
};

export const performMicrosoftEntraSync = async (): Promise<void> => {
  try {
    // NB : for optimization purposes, we call MS graph on groups first to initialize their config
    // but then when we call getUserId, we don't get the config again for each user...

    // Get all assigned users for each group
    const banksRes = await db.query('SELECT id FROM groups');
    const banks = banksRes.rows;
    const assignedMSUsersByBank: { [id: number]: string[] } = {};
    for (let i = 0; i < banks.length; i++) {
      const bank = banks[i];
      const allMsUsersForBank = await MicrosoftGraph.getAllUsersAssignedToUpSignOn(bank.id, true);
      assignedMSUsersByBank[bank.id] = allMsUsersForBank;
    }

    // Loop through users in our db
    const usersRes = await db.query(
      'SELECT id, email, ms_entra_id, deactivated, group_id FROM users',
    );
    const allowedEmailsRes = await db.query('SELECT pattern, group_id FROM allowed_emails');
    for (let i = 0; i < usersRes.rows.length; i++) {
      const u = usersRes.rows[i];
      // First update their ms entra id
      if (!u.ms_entra_id) {
        const msEntraUid = await MicrosoftGraph.getUserId(u.group_id, u.email);
        if (msEntraUid != null) {
          await db.query('UPDATE users SET ms_entra_id=$1 WHERE id=$2 AND group_id=$3', [
            msEntraUid,
            u.id,
            u.group_id,
          ]);
          u.ms_entra_id = msEntraUid;
        }
      }

      // Then check their authorization
      let isMsEntraAllowed = false;
      if (u.ms_entra_id) {
        if (assignedMSUsersByBank[u.group_id].indexOf(u.ms_entra_id) >= 0) {
          isMsEntraAllowed = true;
        } else {
          // maybe the user was recreated with another uuid or completely deleted
          const msEntraUid = await MicrosoftGraph.getUserId(u.group_id, u.email);
          if (msEntraUid != u.ms_entra_id) {
            await db.query('UPDATE users SET ms_entra_id=$1 WHERE id=$2 AND group_id=$3', [
              msEntraUid,
              u.id,
              u.group_id,
            ]);
          }
          // then retry the check
          if (msEntraUid && assignedMSUsersByBank[u.group_id].indexOf(msEntraUid) >= 0) {
            isMsEntraAllowed = true;
          }
        }
      }

      // Maybe the user will be allowed by pattern
      let isEmailPatternAllowed = false;
      if (!isMsEntraAllowed) {
        const bankPatterns = allowedEmailsRes.rows
          .filter((ae) => ae.group_id === u.group_id)
          .map((p) => p.pattern);
        isEmailPatternAllowed = bankPatterns.some((p) => isEmailAuthorizedWithPattern(p, u.email));
      }
      // deactivate or reactivate that user
      const willBeDeactivated = !isEmailPatternAllowed && !isMsEntraAllowed;
      if (willBeDeactivated != !!u.deactivated) {
        await db.query('UPDATE users SET deactivated=$1 WHERE id=$2 AND group_id=$3', [
          willBeDeactivated ? true : null,
          u.id,
          u.group_id,
        ]);
      }
    }
  } catch (e) {
    // if there is an error, we stop everything since the results are no longer guaranted
    logError(e);
  }
};
