import { Router, Request, Response } from 'express';
import storeData from '../data/store.json';
import walletData from '../data/wallet.json';
import { fetchLiveStore, fetchLiveWallet } from '../services/riotClient';

const router = Router();

router.get('/store', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveStore(storeData);
    res.json(data);
  } catch (e) {
    res.json({ ...storeData, source: 'mock' });
  }
});

router.get('/store-v3', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveStore(storeData);
    res.json(data);
  } catch (e) {
    res.json({ ...storeData, source: 'mock' });
  }
});

router.get('/wallet', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveWallet(walletData);
    res.json(data);
  } catch (e) {
    res.json({ ...walletData, source: 'mock' });
  }
});

export default router;
