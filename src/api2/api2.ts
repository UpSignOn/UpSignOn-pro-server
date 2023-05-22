import express from 'express';
import { getBankConfig } from './routes/getBankConfig';
import { getUrlList } from './routes/getUrlList';
import { requestDeviceAccess } from './routes/requestDeviceAccess';
import { getAuthenticationChallenges } from '../api1/routes/getAuthenticationChallenges';
import { checkDevice } from './routes/checkDevice';
import { authenticate } from './routes/authenticate';

export const api2Router = express.Router();

api2Router.all(['/:groupId/bank-config', '/bank-config'], getBankConfig);
api2Router.post(['/:groupId/url-list', '/url-list'], getUrlList);

api2Router.post(['/:groupId/request-device-access', '/request-device-access'], requestDeviceAccess);
api2Router.post(['/:groupId/check-device', '/check-device'], checkDevice);

api2Router.post(
    ['/:groupId/get-authentication-challenges', '/get-authentication-challenges'],
    getAuthenticationChallenges,
);
api2Router.post(['/:groupId/authenticate', '/authenticate'], authenticate);