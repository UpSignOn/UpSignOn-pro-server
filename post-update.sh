#!/bin/bash
~/.npm-global/bin/yarn install
~/.npm-global/bin/yarn build
~/.npm-global/bin/pm2 startOrGracefulReload ecosystem.config.js --update-env
