#!/bin/bash

if [ -z $ENV_FILE_PATH ] ; then
        SCRIPTPATH=$(cd ${0%/*} && pwd -P)
        ENV_FILE_PATH="${SCRIPTPATH}/../.env"
fi

if [ ! -r ${ENV_FILE_PATH} ] ; then
        echo "Could not load .env file from ${ENV_FILE_PATH}" 1>&2
        exit 1
fi

source "${ENV_FILE_PATH}"

echo "Have you run \"dropdb\" then \"createdb $DB_NAME -O $USER\" as postgres user ?"
if [ -z "$1" ] ; then
    echo "Usage: restore-backup.sh path/to/backup-file.sql.gz"
    exit 1
fi
gunzip -c $1 | psql $DB_NAME