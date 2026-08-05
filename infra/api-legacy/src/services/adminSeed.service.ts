import crypto from 'crypto';

import config from '@/config';
import prisma from '@/utils/prisma';
import { hashPassword } from '@/utils/password';
import logger from '@/utils/logger';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

export const seedAdminIfMissing = async () => {
  const email = config.adminSeed.email?.trim();
  const password = config.adminSeed.password;

  if (!email || !password) {
    logger.warn('Admin seed skipped: missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const orgName = config.adminSeed.organizationName || 'Platform Admin';
  const orgSlugBase = toSlug(orgName) || 'platform-admin';

  if (existing) {
    const adminMembership = await prisma.organizationMember.findFirst({
      where: { userId: existing.id, role: 'ADMIN' },
    });

    if (adminMembership) {
      logger.info('Admin seed skipped: user already has admin membership');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const slug = `${orgSlugBase}-${crypto.randomUUID().slice(0, 8)}`;
      const organization = await tx.organization.create({
        data: { name: orgName, slug },
      });

      await tx.organizationMember.create({
        data: {
          userId: existing.id,
          organizationId: organization.id,
          role: 'ADMIN',
        },
      });
    });

    logger.info(`Admin seed membership created for existing user: ${email}`);
    return;
  }

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: config.adminSeed.firstName || 'Platform',
        lastName: config.adminSeed.lastName || 'Admin',
      },
    });

    const slug = `${orgSlugBase}-${crypto.randomUUID().slice(0, 8)}`;
    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug,
      },
    });

    await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'ADMIN',
      },
    });
  });

  logger.info(`Admin seed created: ${email}`);
};
