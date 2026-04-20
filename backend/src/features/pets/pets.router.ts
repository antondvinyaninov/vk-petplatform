// src/features/pets/pets.router.ts
import { Router } from 'express';
import { z } from 'zod';
import { vkAuth } from '../../shared/middleware/vkAuth';
import { prisma } from '../../shared/db';
import { NotFoundError, ValidationError } from '../../shared/errors';

export const petsRouter = Router();

const createPetSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
});

// GET /api/pets — список питомцев текущего пользователя
petsRouter.get('/', vkAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { vk_id: Number(req.vkUser.vk_user_id) } });
    if (!user) return res.json([]);

    const pets = await prisma.pet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pets);
  } catch (err) {
    next(err);
  }
});

// POST /api/pets — создать питомца
petsRouter.post('/', vkAuth, async (req, res, next) => {
  try {
    const parsed = createPetSchema.safeParse(req.body);
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

    const pet = await prisma.pet.create({
      data: { ...parsed.data, userId: user.id },
    });
    res.status(201).json(pet);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pets/:id
petsRouter.delete('/:id', vkAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await prisma.user.findUnique({ where: { vk_id: Number(req.vkUser.vk_user_id) } });
    if (!user) throw new NotFoundError('Pet', id);

    const pet = await prisma.pet.findFirst({ where: { id, userId: user.id } });
    if (!pet) throw new NotFoundError('Pet', id);

    await prisma.pet.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
