import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './shared/prisma/prisma.service';

describe('AppModule', () => {
  it('resolves the full dependency injection graph', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn().mockResolvedValue(undefined), $disconnect: jest.fn().mockResolvedValue(undefined) })
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    await app.close();
  });
});
