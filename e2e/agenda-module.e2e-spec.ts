import { Test, TestingModule } from '@nestjs/testing';
import Agenda from 'agenda-ts';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AgendaModule } from '../lib';
import { DatabaseService } from '../lib/providers/database.service';
import { JobsHandler } from './jobs.handler';

jest.setTimeout(10000);

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

    let database: DatabaseService;

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
          AgendaModule.registerQueue('jobs'),
        ],
        providers: [JobsHandler],
      }).compile();

      jobsHandler = testingModule.get(JobsHandler);

      agenda = testingModule.get<Agenda>('jobs-queue', { strict: false });

      database = testingModule.get<DatabaseService>(DatabaseService, { strict: false });

      jest.spyOn(database, 'disconnect');

      await testingModule.init();

      await agenda._ready;

      // Give the jobs a chance to run
      await wait(1000);
    });

    afterAll(async () => {
      await agenda.stop();

      await testingModule.close();

      expect(database.disconnect).toHaveBeenCalled();
    });

    it('should schedule a job to run at the given interval', () => {
      expect(jobsHandler.handled).toContain('every1Second');
    });

    it('should run handle jobs scheduled to run immediately', () => {
      expect(jobsHandler.handled).toContain('runNow');
    });

    it('should notify when the queue is ready', () => {
      expect(jobsHandler.handled).toContain('onQueueReady');
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

  describe('configuration', () => {
    it('should auto start the queue', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          AgendaModule.forRootAsync({
            useFactory: (mongoUri: string) => {
              return { db: { address: mongoUri } };
            },
            inject: ['MONGO_URI'],
            extraProviders: [databaseProvider],
          }),
          AgendaModule.registerQueue('jobs'),
        ],
        providers: [JobsHandler],
      }).compile();

      const agenda = testingModule.get<Agenda>('jobs-queue', { strict: false });

      jest.spyOn(agenda, 'start');

      await testingModule.init();

      await agenda._ready;

      await wait(1000);

      expect(agenda.start).toHaveBeenCalled();

      await agenda.stop();
      await testingModule.close();
    });

    it('should not auto start the queue', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          AgendaModule.forRootAsync({
            useFactory: (mongoUri: string) => {
              return { db: { address: mongoUri } };
            },
            inject: ['MONGO_URI'],
            extraProviders: [databaseProvider],
          }),
          AgendaModule.registerQueue('jobs', {
            autoStart: false,
          }),
        ],
        providers: [JobsHandler],
      }).compile();

      const agenda = testingModule.get<Agenda>('jobs-queue', { strict: false });

      jest.spyOn(agenda, 'start');

      await testingModule.init();

      await agenda._ready;

      expect(agenda.start).not.toHaveBeenCalled();

      await testingModule.close();
    });

    it('should use custom collection name', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          AgendaModule.forRootAsync({
            useFactory: (mongoUri: string) => {
              return { db: { address: mongoUri } };
            },
            inject: ['MONGO_URI'],
            extraProviders: [databaseProvider],
          }),
          AgendaModule.registerQueue('jobs', {
            collection: 'galactus',
          }),
        ],
        providers: [JobsHandler],
      }).compile();

      const agenda = testingModule.get<Agenda>('jobs-queue', { strict: false });

      await testingModule.init();

      await agenda._ready;

      await wait(1000);

      expect(agenda._collection.collectionName).toBe('galactus');

      await agenda.stop();
      await testingModule.close();
    });
  });
});
