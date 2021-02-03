import express from 'express';
import { startServer } from './helpers/serverProcess';
import { requestAccess } from './requestAccess';
import { checkDevice } from './checkDevice';
import { getData } from './getData';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

app.post('/request-access', requestAccess);
app.get('/check-device', checkDevice);
app.post('/get-data', getData);

if (module === require.main) {
  startServer(app);
}

module.exports = app;
