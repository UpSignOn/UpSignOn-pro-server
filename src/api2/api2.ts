import express from 'express';
import { getBankConfig } from './routes/getBankConfig';
import { getUrlList } from './routes/getUrlList';

export const api2Router = express.Router();

api2Router.all(['/:groupId/bank-config', '/bank-config'], getBankConfig);
api2Router.post(['/:groupId/url-list', '/url-list'], getUrlList);