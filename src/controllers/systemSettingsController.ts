import { Request, Response } from 'express';
import { SystemSetting } from '../models/systemSetting';

// GET all settings
export async function getAllSettings(req: Request, res: Response) {
  const settings = await SystemSetting.findAll();
  res.json(settings);
}

// GET single setting by key
export async function getSettingByKey(req: Request, res: Response) {
  const setting = await SystemSetting.findOne({ where: { key: req.params.key } });
  if (!setting) return res.status(404).json({ error: 'Setting not found' });
  res.json(setting);
}

// UPDATE setting by key
export async function updateSetting(req: Request, res: Response) {
  const { value } = req.body;
  const setting = await SystemSetting.findOne({ where: { key: req.params.key } });
  if (!setting) return res.status(404).json({ error: 'Setting not found' });
  (setting as any).set('value', value);
  await (setting as any).save();
  res.json(setting);
}

// CREATE new setting
export async function createSetting(req: Request, res: Response) {
  const { key, value, description, type } = req.body;
  const exists = await SystemSetting.findOne({ where: { key } });
  if (exists) return res.status(400).json({ error: 'Setting already exists' });
  const setting = await SystemSetting.create({ key, value, description, type });
  res.status(201).json(setting);
}

// DELETE setting
export async function deleteSetting(req: Request, res: Response) {
  const setting = await SystemSetting.findOne({ where: { key: req.params.key } });
  if (!setting) return res.status(404).json({ error: 'Setting not found' });
  await setting.destroy();
  res.json({ success: true });
}
