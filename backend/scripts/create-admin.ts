import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/encryption';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME;
  const lastName = process.env.ADMIN_LAST_NAME;

  if (!email || !password || !firstName || !lastName) {
    logger.error('Missing required environment variables for admin creation');
    process.exit(1);
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      logger.warn('Admin user with this email already exists');
      return;
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
    });

    logger.info(`Admin user created successfully: ${adminUser.email}`);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
