# Developer documentation

- prerequisite:
  - nodeJS version `14.*`
  - yarn
  - pm2
  - postgreSQL
    - https://www.tutorialspoint.com/postgresql/postgresql_create_database.htm
      => `createdb upsignonpro`

# Deployment

- copy ecosystem.example.config.js
  - put your own environment variables
  - test everything works, especially sending the email (look out for error logs from the server)
