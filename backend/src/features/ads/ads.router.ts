// src/features/ads/ads.router.ts
import { Router } from 'express';
import { z } from 'zod';
import { vkAuth } from '../../shared/middleware/vkAuth';
import { prisma } from '../../shared/db';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { VKService } from '../../shared/vk/vk.service';

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
    const status = (req.query.status as string) || 'ACTIVE';
    
    const whereClause: any = { status };
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
      pets: ad.pets ? {
        ...ad.pets,
        vkGroupId: (ad.pets as any).vkGroupId?.toString(),
      } : null,
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

    let user = await prisma.user.findUnique({ where: { vk_id: req.vkUser.vk_user_id as any } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          vk_id: req.vkUser.vk_user_id as any, 
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

    const adWithPet = await prisma.petplatform_ads.findUnique({
      where: { id: ad.id },
      include: { pets: true },
    });

    res.status(201).json({
      ...adWithPet,
      vkGroupId: (adWithPet as any)?.vkGroupId?.toString(),
      pets: adWithPet?.pets ? {
        ...adWithPet.pets,
        vkGroupId: (adWithPet.pets as any).vkGroupId?.toString(),
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/my — Мои объявления
adsRouter.get('/my', vkAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { vk_id: req.vkUser.vk_user_id as any },
    });

    if (!user) {
      return res.json([]);
    }

    const ads = await prisma.petplatform_ads.findMany({
      where: { userId: user.id },
      include: { pets: true },
      orderBy: { createdAt: 'desc' },
    });

    const serializedAds = ads.map(ad => ({
      ...ad,
      vkGroupId: (ad as any).vkGroupId?.toString(),
      pets: ad.pets ? {
        ...ad.pets,
        vkGroupId: (ad.pets as any).vkGroupId?.toString(),
      } : null,
    }));

    res.json(serializedAds);
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
    
    // Сериализация BigInt
    res.json({
      ...ad,
      vkGroupId: (ad as any).vkGroupId?.toString(),
      pets: ad.pets ? {
        ...ad.pets,
        vkGroupId: (ad.pets as any).vkGroupId?.toString(),
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/ads/:id/moderate — Модерация объявления
adsRouter.patch('/:id/moderate', vkAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status, scheduledAt } = req.body;

    const ad = await prisma.petplatform_ads.findUnique({
      where: { id },
    });

    if (!ad) throw new NotFoundError('Ad', id);

    // Обновляем статус в БД
    const updatedAd = await prisma.petplatform_ads.update({
      where: { id },
      data: { 
        status, 
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null 
      },
    });

    // Если одобрено и есть привязка к группе ВК — публикуем пост
    let vkPostId = null;
    if (status === 'ACTIVE' && ad.vkGroupId) {
      // Ищем токен сообщества
      const settings = await prisma.organization_vk_settings.findUnique({
        where: { vk_group_id: ad.vkGroupId },
      });

      if (settings?.access_token) {
        try {
          const postId = await VKService.publishToCommunityWall(updatedAd, settings.access_token);
          vkPostId = postId;
          
          // Сохраняем ID поста в БД (через BigInt для безопасности)
          await prisma.petplatform_ads.update({
            where: { id },
            data: { vkPostId: BigInt(postId) },
          });
        } catch (postError: any) {
          console.error('[VK Posting Failed]', postError.message);
        }
      }
    }

    res.json({
      ...updatedAd,
      vkGroupId: (updatedAd as any).vkGroupId?.toString(),
      vkPostId: vkPostId?.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ads/settings/token — Сохранение токена сообщества
adsRouter.post('/settings/token', vkAuth, async (req, res, next) => {
  try {
    const { vk_group_id, access_token } = req.body;
    
    if (!vk_group_id || !access_token) {
      throw new ValidationError('Missing group id or token');
    }

    const groupId = BigInt(vk_group_id);

    // 1. Сначала убеждаемся, что организация существует
    const organization = await prisma.organizations.upsert({
      where: { vk_group_id: groupId },
      update: {},
      create: {
        name: `Сообщество ${vk_group_id}`,
        vk_group_id: groupId,
      },
    });

    // 2. Теперь сохраняем или обновляем токен (upsert)
    const settings = await prisma.organization_vk_settings.upsert({
      where: { organization_id: organization.id },
      update: { 
        access_token,
        vk_group_id: groupId
      },
      create: { 
        organization_id: organization.id,
        vk_group_id: groupId,
        access_token,
      },
    });

    res.json({
      success: true,
      vk_group_id: settings.vk_group_id.toString(),
    });
  } catch (err) {
    next(err);
  }
});
