import { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
