#!/bin/bash

scriptDir=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")
~/.npm-global/bin/pm2 startOrGracefulReload $scriptDir/ecosystem.config.js --update-env
