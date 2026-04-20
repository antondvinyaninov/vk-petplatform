// src/features/ads/ads.router.ts
import { Router } from 'express';
import { z } from 'zod';
import { vkAuth } from '../../shared/middleware/vkAuth';
import { prisma } from '../../shared/db';
import { NotFoundError, ValidationError } from '../../shared/errors';

export const adsRouter = Router();

const createAdSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['LOST', 'FOUND', 'ADOPTION']),
  petId: z.number().int().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cityTitle: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

// GET /api/ads — Лента объявлений
adsRouter.get('/', vkAuth, async (req, res, next) => {
  try {
    const vkGroupId = req.vkUser.vk_group_id;
    
    // Если мы в контексте группы — фильтруем по ней. Если нет — показываем все активные.
    const whereClause: any = { status: 'ACTIVE' };
    if (vkGroupId) {
      whereClause.vkGroupId = vkGroupId;
    }

    const ads = await prisma.petplatform_ads.findMany({
      where: whereClause,
      include: { pets: true, users: { select: { name: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Сериализация BigInt
    const serializedAds = ads.map(ad => ({
      ...ad,
      vkGroupId: (ad as any).vkGroupId?.toString(),
    }));

    res.json(serializedAds);
  } catch (err) {
    next(err);
  }
});

// POST /api/ads — Создать объявление
adsRouter.post('/', vkAuth, async (req, res, next) => {
  try {
    const parsed = createAdSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.message);

    let user = await prisma.user.findUnique({ where: { vk_id: Number(req.vkUser.vk_user_id) } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          vk_id: Number(req.vkUser.vk_user_id), 
          name: 'Пользователь VK', 
          lastName: '',
          email: `vk_${req.vkUser.vk_user_id}@vk.mini.app`,
          password_hash: 'vk_oauth_placeholder',
        },
      });
    }

    // Если передан petId, убедимся что он принадлежит пользователю
    if (parsed.data.petId) {
      const pet = await prisma.pet.findFirst({
        where: { id: parsed.data.petId, userId: user.id },
      });
      if (!pet) throw new ValidationError('Invalid petId');
    }

    const ad = await prisma.petplatform_ads.create({
      data: { 
        ...parsed.data, 
        userId: user.id,
        vkGroupId: req.vkUser.vk_group_id, 
      } as any,
    });

    res.status(201).json({
      ...ad,
      vkGroupId: (ad as any).vkGroupId?.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/:id — Детальная страница объявления
adsRouter.get('/:id', vkAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const ad = await prisma.petplatform_ads.findUnique({
      where: { id },
      include: { pets: true, users: { select: { name: true, lastName: true, avatar: true } } },
    });
    if (!ad) throw new NotFoundError('Ad', id);
    res.json(ad);
  } catch (err) {
    next(err);
  }
});
