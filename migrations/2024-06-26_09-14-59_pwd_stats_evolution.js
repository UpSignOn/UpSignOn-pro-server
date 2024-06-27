//2024-06-26_09-14-59_pwd_stats_evolution
const getDaysArray = (startDay) => {
  const current = new Date(startDay);
  const end = new Date();
  const res = [];
  let hasNextDate = true;
  while (hasNextDate) {
    res.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
    hasNextDate = current.getTime() < end.getTime();
  }
  return res;
};

exports.up = async function (db) {
  await db.query(
    'CREATE TABlE IF NOT EXISTS pwd_stats_evolution (date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP(0), group_id INTEGER, nb_accounts INTEGER, nb_codes INTEGER, nb_accounts_strong INTEGER, nb_accounts_medium INTEGER, nb_accounts_weak INTEGER, nb_accounts_with_duplicated_password INTEGER, nb_accounts_with_no_password INTEGER, nb_accounts_red INTEGER, nb_accounts_orange INTEGER, nb_accounts_green INTEGER, PRIMARY KEY (date, group_id))',
  );

  // migrate from data_stats
  try {
    let rawStats = await db.query(
      `SELECT
      user_id,
      group_id,
      shared_vault_id,
      date_trunc('day', date) as day,
      nb_accounts,
      nb_codes,
      nb_accounts_strong,
      nb_accounts_medium,
      nb_accounts_weak,
      nb_accounts_with_no_password,
      nb_accounts_with_duplicated_password,
      nb_accounts_red,
      nb_accounts_orange,
      nb_accounts_green
      FROM data_stats ORDER BY date ASC`, // order by date not day to keep only the last stat of a day per user or shared vault
    );

    if (rawStats.rowCount > 0) {
      const allGroupIds = rawStats.rows.reduce((accumulator, currentRow) => {
        if (accumulator.indexOf(currentRow.group_id) === -1) {
          accumulator.push(currentRow.group_id);
        }
        return accumulator;
      }, []);
      for (var gId of allGroupIds) {
        var groupStats = rawStats.rows.filter((s) => s.group_id === gId);

        const chartDataPerVaultPerDay = {};
        groupStats.forEach((r) => {
          const d = r.day.toISOString().split('T')[0];
          if (r.user_id) {
            if (!chartDataPerVaultPerDay['v' + r.user_id]) {
              chartDataPerVaultPerDay['v' + r.user_id] = {};
            }
            chartDataPerVaultPerDay['v' + r.user_id][d] = r; // this will erase previous stats for the same day
          } else if (r.shared_vault_id) {
            if (!chartDataPerVaultPerDay['sv' + r.shared_vault_id]) {
              chartDataPerVaultPerDay['sv' + r.shared_vault_id] = {};
            }
            chartDataPerVaultPerDay['sv' + r.shared_vault_id][d] = r;
          }
        });
        // Then get the continuous list of days
        const days = getDaysArray(groupStats[0].day).map((d) => d);
        // Init chart data object
        const chartDataObjet = {};
        days.forEach((d) => {
          chartDataObjet[d] = {
            day: d,
            nbAccounts: 0,
            nbCodes: 0,
            nbAccountsStrong: 0,
            nbAccountsMedium: 0,
            nbAccountsWeak: 0,
            nbAccountsWithNoPassword: 0,
            nbDuplicatePasswords: 0,
            nbAccountsGreen: 0,
            nbAccountsOrange: 0,
            nbAccountsRed: 0,
          };
        });
        // Then map each day to its stats
        const vaultList = Object.keys(chartDataPerVaultPerDay);
        vaultList.forEach((u) => {
          let lastKnownStats = null;
          const userStats = chartDataPerVaultPerDay[u];
          days.forEach((d) => {
            if (userStats[d]) {
              lastKnownStats = userStats[d];
            }
            chartDataObjet[d].nbCodes += lastKnownStats?.nb_codes || 0;
            chartDataObjet[d].nbAccountsStrong += lastKnownStats?.nb_accounts_strong || 0;
            chartDataObjet[d].nbAccountsMedium += lastKnownStats?.nb_accounts_medium || 0;
            chartDataObjet[d].nbAccountsWeak += lastKnownStats?.nb_accounts_weak || 0;
            chartDataObjet[d].nbAccountsWithNoPassword +=
              lastKnownStats?.nb_accounts_with_no_password || 0;
            chartDataObjet[d].nbAccounts += lastKnownStats?.nb_accounts || 0;
            chartDataObjet[d].nbDuplicatePasswords +=
              lastKnownStats?.nb_accounts_with_duplicated_password || 0;
            chartDataObjet[d].nbAccountsGreen += lastKnownStats?.nb_accounts_green || 0;
            chartDataObjet[d].nbAccountsOrange += lastKnownStats?.nb_accounts_orange || 0;
            chartDataObjet[d].nbAccountsRed += lastKnownStats?.nb_accounts_red || 0;
          });
        });
        for (let i = 0; i < days.length; i++) {
          const d = days[i];
          await db.query(
            `INSERT INTO pwd_stats_evolution (date,
              group_id,
              nb_accounts,
              nb_codes,
              nb_accounts_strong,
              nb_accounts_medium,
              nb_accounts_weak,
              nb_accounts_with_duplicated_password,
              nb_accounts_with_no_password,
              nb_accounts_red,
              nb_accounts_orange,
              nb_accounts_green) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (date, group_id) DO NOTHING`,
            [
              `${d}T21:59:59.000Z`,
              gId,
              chartDataObjet[d].nbAccounts,
              chartDataObjet[d].nbCodes,
              chartDataObjet[d].nbAccountsStrong,
              chartDataObjet[d].nbAccountsMedium,
              chartDataObjet[d].nbAccountsWeak,
              chartDataObjet[d].nbDuplicatePasswords,
              chartDataObjet[d].nbAccountsWithNoPassword,
              chartDataObjet[d].nbAccountsRed,
              chartDataObjet[d].nbAccountsOrange,
              chartDataObjet[d].nbAccountsGreen,
            ],
          );
        }
      }
    }

    // FINALLY, remove data_stats table
    await db.query('DROP TABLE data_stats');
  } catch (e) {
    console.log('migrate from data_stats to pwd_stats_evolution', e);
  }
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS pwd_stats_evolution');
};
