// src/shared/middleware/vkAuth.ts
// Верификация подписи VK Mini Apps (sign) по HMAC-SHA256
// https://dev.vk.com/ru/mini-apps/development/launch-params#%D0%9F%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B0-%D0%BF%D0%BE%D0%B4%D0%BF%D0%B8%D1%81%D0%B8

import { createHmac } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { UnauthorizedError } from '../errors';

export interface VkLaunchParams {
  vk_user_id: bigint;
  vk_app_id: number;
  vk_group_id?: bigint;
  vk_platform?: string;
  vk_language?: string;
  vk_is_app_user?: number;
  vk_viewer_group_role?: 'admin' | 'editor' | 'moder' | 'member' | 'none';
}

// Добавляем vkUser к Request
declare global {
  namespace Express {
    interface Request {
      vkUser: VkLaunchParams;
    }
  }
}

function verifyVkSign(query: Record<string, string>, secret: string): boolean {
  const sign = query['sign'];
  if (!sign) return false;

  // Оставляем только vk_* параметры, сортируем
  const vkParams = Object.entries(query)
    .filter(([key]) => key.startsWith('vk_'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const expected = createHmac('sha256', secret)
    .update(vkParams)
    .digest('base64url');

  return expected === sign;
}

export function vkAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    // VK передаёт параметры в заголовке или query-string
    const rawQuery = (req.headers['x-vk-sign'] as string) || req.query as unknown as string;
    const params = typeof rawQuery === 'string'
      ? Object.fromEntries(new URLSearchParams(rawQuery))
      : req.query as Record<string, string>;

    if (!verifyVkSign(params, config.vk.appSecret)) {
      throw new UnauthorizedError('Invalid VK signature');
    }

    // LongID: vk_user_id — BigInt (см. vk-platform-rules skill)
    req.vkUser = {
      vk_user_id: BigInt(params.vk_user_id || '0'),
      vk_app_id: parseInt(params.vk_app_id || '0', 10),
      vk_group_id: params.vk_group_id ? BigInt(params.vk_group_id) : undefined,
      vk_platform: params.vk_platform,
      vk_language: params.vk_language,
      vk_is_app_user: params.vk_is_app_user ? parseInt(params.vk_is_app_user, 10) : undefined,
      vk_viewer_group_role: params.vk_viewer_group_role as any,
    };

    next();
  } catch (err) {
    next(err);
  }
}
