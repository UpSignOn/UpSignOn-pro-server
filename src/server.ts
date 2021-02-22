import express from 'express';
import { startServer } from './helpers/serverProcess';
import { requestAccess } from './routes/requestAccess';
import { checkDevice } from './routes/checkDevice';
import { getData } from './routes/getData';
import { updateData } from './routes/updateData';
import { getConfig } from './routes/getConfig';
import { getUrlList } from './routes/getUrlList';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

app.post('/config', getConfig);
app.post('/url-list', getUrlList);
app.post('/request-access', requestAccess);
app.get('/check-device', checkDevice);
app.post('/get-data', getData);
app.post('/update-data', updateData);

if (module === require.main) {
  startServer(app);
}

module.exports = app;
