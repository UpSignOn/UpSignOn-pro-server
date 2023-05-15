# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:16
USER node

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
ENV NODE_ENV=production

WORKDIR /home/node/upsignonpro-server

COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./
RUN yarn install --production
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node compiled ./compiled

CMD node compiled/server.js

EXPOSE 3000