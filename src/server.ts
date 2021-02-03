import express from 'express';
import { getData } from './getData';
import { startServer } from './helpers/serverProcess';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

app.post('/get-data', getData);

if (module === require.main) {
  startServer(app);
}

module.exports = app;
