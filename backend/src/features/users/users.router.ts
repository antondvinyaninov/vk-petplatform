// src/features/users/users.router.ts
import { Router } from 'express';
import { vkAuth } from '../../shared/middleware/vkAuth';
import { prisma } from '../../shared/db';

export const usersRouter = Router();

// GET /api/users/me — получить или создать текущего пользователя
usersRouter.get('/me', vkAuth, async (req, res, next) => {
  try {
    const { vk_user_id } = req.vkUser;

    let user = await prisma.user.findUnique({
      where: { vk_id: Number(vk_user_id) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          vk_id: Number(vk_user_id),
          name: 'Пользователь VK',
          lastName: '',
          email: `vk_${vk_user_id}@vk.mini.app`,
          password_hash: 'vk_oauth_placeholder',
        },
      });
    }

    res.json({
      ...user,
      vkUserId: user.vk_id ? user.vk_id.toString() : '', 
    });
  } catch (err) {
    next(err);
  }
});
