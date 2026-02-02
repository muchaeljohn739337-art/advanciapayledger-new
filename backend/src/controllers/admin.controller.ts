import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/encryption';
import { logger } from '../utils/logger';

class AdminController {
  async createAdmin(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const hashedPassword = await hashPassword(password);

      const adminUser = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      logger.info(`Admin user created: ${email}`);
      res.status(201).json(adminUser);
    } catch (error) {
      logger.error('Error creating admin user:', error);
      res.status(500).json({ error: 'Failed to create admin user' });
    }
  }
}

export const adminController = new AdminController();
