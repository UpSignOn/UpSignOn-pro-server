
#!/bin/bash

# Adapted from https://wiki.postgresql.org/wiki/Automated_Backup_on_Linux

FILENAME=$1

if [ -z $ENV_FILE_PATH ] ; then
        SCRIPTPATH=$(cd ${0%/*} && pwd -P)
        ENV_FILE_PATH="${SCRIPTPATH}/../.env"
fi

if [ ! -r ${ENV_FILE_PATH} ] ; then
        echo "Could not load .env file from ${ENV_FILE_PATH}" 1>&2
        exit 1
fi

source "${ENV_FILE_PATH}"

function perform_backup()
{
        FINAL_BACKUP_DIR=~/

        set -o pipefail
        if ! PGPASSWORD="$DB_PASS" pg_dump -Fp -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -T "admin_sessions" -T "device_sessions" -T "temporary_admins" "$DB_NAME" | gzip > $FINAL_BACKUP_DIR"$DB_NAME".sql.gz.in_progress; then
                echo "[!!ERROR!!] Failed to produce plain backup database $DB_NAME" 1>&2
        else
                mv $FINAL_BACKUP_DIR"$DB_NAME".sql.gz.in_progress $FINAL_BACKUP_DIR"$DB_NAME".sql.gz
        fi
        set +o pipefail
}

perform_backup
