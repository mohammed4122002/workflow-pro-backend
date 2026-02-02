import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const adminEmail = 'admin@workflowpro.com';
  const originalPassword = 'Password123!';
  const newPassword = 'NewPass123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();
    const passwordHash = await bcrypt.hash(originalPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        fullName: 'Admin User',
        role: 'ADMIN',
        department: 'Administration',
        isActive: true,
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
      },
      create: {
        email: adminEmail,
        fullName: 'Admin User',
        role: 'ADMIN',
        department: 'Administration',
        isActive: true,
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
      },
    });
  });

  afterAll(async () => {
    const passwordHash = await bcrypt.hash(originalPassword, 10);
    await prisma.user
      .update({
        where: { email: adminEmail },
        data: {
          passwordHash,
          passwordUpdatedAt: new Date(),
          mustChangePassword: false,
        },
      })
      .catch(() => undefined);

    await prisma.$disconnect();
    await app.close();
  });

  it('login succeeds with correct password', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: originalPassword })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(adminEmail);
  });

  it('login fails with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'WrongPass123!' })
      .expect(401);
  });

  it('change password succeeds and old password stops working', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: originalPassword })
      .expect(201);

    const token = loginResponse.body.accessToken;
    await request(app.getHttpServer())
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: originalPassword, newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: originalPassword })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: newPassword })
      .expect(201);
  });
});
