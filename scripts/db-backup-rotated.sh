#!/bin/bash

# Adapted from https://wiki.postgresql.org/wiki/Automated_Backup_on_Linux

###########################
####### LOAD ENV #######
###########################


while [ $# -gt 0 ]; do
        case $1 in
                -c)
                        ENV_FILE_PATH="$2"
                        shift 2
                        ;;
                *)
                        ${ECHO} "Unknown Option \"$1\"" 1>&2
                        exit 2
                        ;;
        esac
done

if [ -z $ENV_FILE_PATH ] ; then
        SCRIPTPATH=$(cd ${0%/*} && pwd -P)
        ENV_FILE_PATH="${SCRIPTPATH}/../.env"
fi

if [ ! -r ${ENV_FILE_PATH} ] ; then
        echo "Could not load .env file from ${ENV_FILE_PATH}" 1>&2
        exit 1
fi

source "${ENV_FILE_PATH}"

###########################
#### START THE BACKUPS ####
###########################

function perform_backups()
{
        SUFFIX=$1
        FINAL_BACKUP_DIR=$DB_BACKUP_DIR"`date +\%Y-\%m-\%d`$SUFFIX/"

        echo "Making backup directory in $FINAL_BACKUP_DIR"

        if ! mkdir -p $FINAL_BACKUP_DIR; then
                echo "Cannot create backup directory in $FINAL_BACKUP_DIR. Go and fix it!" 1>&2
                exit 1;
        fi;

        ###########################
        ###### FULL BACKUP #######
        ###########################

        echo -e "\n\nPerforming full backup"
        echo -e "--------------------------------------------\n"

        set -o pipefail
        if ! PGPASSWORD="$DB_PASS" pg_dump -Fp -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -T "admin_sessions" -T "device_sessions" -T "temporary_admins" "$DB_NAME" | gzip > $FINAL_BACKUP_DIR"$DB_NAME".sql.gz.in_progress; then
                echo "[!!ERROR!!] Failed to produce plain backup database $DB_NAME" 1>&2
        else
                mv $FINAL_BACKUP_DIR"$DB_NAME".sql.gz.in_progress $FINAL_BACKUP_DIR"$DB_NAME".sql.gz
        fi
        set +o pipefail
}

# MONTHLY BACKUPS

DAY_OF_MONTH=`date +%d`

if [ $DAY_OF_MONTH -eq 1 ];
then
        # Delete all expired monthly directories
        find $DB_BACKUP_DIR -maxdepth 1 -name "*-monthly" -exec rm -rf '{}' ';'

        perform_backups "-monthly"

        exit 0;
fi

# WEEKLY BACKUPS

DAY_OF_WEEK=`date +%u` #1-7 (Monday-Sunday)
EXPIRED_DAYS=`expr $((($DB_BACKUP_WEEKS_TO_KEEP * 7) + 1))`

if [ $DAY_OF_WEEK = $DB_BACKUP_DAY_OF_WEEK_TO_KEEP ];
then
        # Delete all expired weekly directories
        find $DB_BACKUP_DIR -maxdepth 1 -mtime +$EXPIRED_DAYS -name "*-weekly" -exec rm -rf '{}' ';'

        perform_backups "-weekly"

        exit 0;
fi

# DAILY BACKUPS

# Delete daily backups 7 days old or more
find $DB_BACKUP_DIR -maxdepth 1 -mtime +$DB_BACKUP_DAYS_TO_KEEP -name "*-daily" -exec rm -rf '{}' ';'

perform_backups "-daily"
