// src/features/users/users.router.ts
import { Router } from 'express';
import { vkAuth } from '../../shared/middleware/vkAuth';
import { prisma } from '../../shared/db';

export const usersRouter = Router();

// GET /api/users/me — получить, создать или обновить текущего пользователя
usersRouter.get('/me', vkAuth, async (req, res, next) => {
  try {
    const { vk_user_id } = req.vkUser;
    const { firstName, lastName, photo200, cityTitle } = req.query;

    const vkId = Number(vk_user_id);

    // Умный Upsert: создаем или обновляем
    const user = await prisma.user.upsert({
      where: { vk_id: vkId },
      update: {
        last_seen: new Date(),
        // Обновляем только если данные пришли
        ...(firstName && { name: String(firstName) }),
        ...(lastName && { lastName: String(lastName) }),
        ...(photo200 && { avatar: String(photo200) }),
        ...(cityTitle && { location: String(cityTitle) }),
      },
      create: {
        vk_id: vkId,
        name: firstName ? String(firstName) : 'Пользователь VK',
        lastName: lastName ? String(lastName) : '',
        email: `vk_${vkId}@vk.mini.app`,
        password_hash: 'vk_oauth_placeholder',
        avatar: photo200 ? String(photo200) : null,
        location: cityTitle ? String(cityTitle) : null,
        verified: true,
      },
    });

    res.json({
      ...user,
      vkUserId: user.vk_id ? user.vk_id.toString() : '',
    });
  } catch (err) {
    next(err);
  }
});
