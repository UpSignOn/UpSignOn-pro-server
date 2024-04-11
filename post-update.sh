#!/bin/bash

scriptDir=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")

# Restarting = stop then start (has downtime)
# Reloading = start new instance then stop old instance (has no downtime)
~/.npm-global/bin/pm2 startOrGracefulReload $scriptDir/ecosystem.config.js --update-env
