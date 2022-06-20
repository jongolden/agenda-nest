import { Test, TestingModule } from '@nestjs/testing';
import Agenda from 'agenda';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AgendaModule } from '../lib';
import { JobsHandler } from './jobs.handler';

let mongo: MongoMemoryServer;

const databaseProvider = {
  provide: 'MONGO_URI',
  useFactory: async () => {
    mongo = await MongoMemoryServer.create();
    return mongo.getUri();
  }
};

const wait = (interval: number) => new Promise<void>((resolve) => {
  setTimeout(() => resolve(), interval);
});

describe('Agenda Module', () => {
  describe('handles decorators', () => {
    let testingModule: TestingModule;

    let jobsHandler: JobsHandler;

    let agenda: Agenda;

    beforeAll(async () => {
      testingModule = await Test.createTestingModule({
        imports: [
          AgendaModule.forRootAsync({
            useFactory: (mongoUri: string) => {
              return { db: { address: mongoUri } };
            },
            inject: ['MONGO_URI'],
            extraProviders: [databaseProvider],
          }),
          AgendaModule.forFeature({
            queue: 'jobs',
          }),
        ],
        providers: [JobsHandler],
      }).compile();

      jobsHandler = testingModule.get(JobsHandler);

      agenda = testingModule.get<Agenda>('jobs-queue', { strict: false });

      await agenda._ready;

      await testingModule.init();

      await wait(1000);
    });

    afterAll(async () => {
      await agenda.stop();

      if (mongo) {
        await mongo.stop({
          doCleanup: true,
        });
      }

      await testingModule.close();
    });

    it('should schedule a job to run at the given interval', () => {
      expect(jobsHandler.handled).toContain('every1Second');
    });

    it('should run handle jobs scheduled to run immediately', () => {
      expect(jobsHandler.handled).toContain('runNow');
    });

    it('should notify when any job has started', () => {
      expect(jobsHandler.handled).toContain('onJobStart');
    });

    it('should notify when a specific job has started', () => {
      expect(jobsHandler.handled).toContain('onTestJobStart');
    });

    it('should notify when a specifc job has completed', () => {
      expect(jobsHandler.handled).toContain('onTestJobComplete');
    });

    it('should notify when a job has completed', () => {
      expect(jobsHandler.handled).toContain('onTestJobSuccess');
    });

    it('should notify when a job has failed', () => {
      expect(jobsHandler.handled).toContain('onJobFail');
    });
  });
});
