import { Injectable } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AgendaModule } from '../lib';
import { Every, OnJobComplete, OnJobFail, OnJobStart, OnJobSuccess, OnQueueReady } from '../lib/decorators';
import { AgendaService } from '../lib/providers';

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
})

describe('Agenda Module', () => {
  describe('handles decorators', () => {
    class JobsHandler {
      handled: string[] = [];

      @OnQueueReady()
      onQueueReady() {
        this.handled.push('OnQueReady');
      }

      @Every('1 second')
      testJob() {
        this.handled.push('testJob');
      }

      @OnJobStart()
      onJobStart() {
        this.handled.push('OnJobStart');
      }

      @OnJobStart('testJob')
      onTestJobStart() {
        this.handled.push('OnJobStart:testJob');
      }

      @OnJobComplete('testJob')
      onTestJobComplete() {
        this.handled.push('OnJobComplete:testJob');
      }

      @OnJobSuccess('testJob')
      onTestJobSuccess() {
        this.handled.push('OnJobSuccess:testJob');
      }

      @Every({ name: 'test failure', interval: '1 second' })
      testFailedJob() {
        this.handled.push('test failure');
        throw new Error('job failed');
      }

      @OnJobFail('test failure')
      onTestFailure(error: Error) {
        this.handled.push('OnJobFail:test failure');
      }
    }

    let testingModule: TestingModule;

    let metadataScanner: MetadataScanner;

    let agendaService: AgendaService;

    let jobsHandler: JobsHandler;

    beforeAll(async () => {
      testingModule = await Test.createTestingModule({
        imports: [
          AgendaModule.registerAsync({
            useFactory: (mongoUri: string) => {
              return {
                db: {
                  address: mongoUri,
                  collection: 'agenda-queue',
                },
              };
            },
            inject: ['MONGO_URI'],
            extraProviders: [databaseProvider],
          }),
        ],
        providers: [JobsHandler],
      }).compile();

      metadataScanner = testingModule.get(MetadataScanner);

      agendaService = testingModule.get(AgendaService);

      jobsHandler = testingModule.get(JobsHandler);

      jest.spyOn(metadataScanner, 'scanFromPrototype');

      await testingModule.init();

      await agendaService._ready;

      await wait(1000);
    });

    afterAll(async () => {
      await agendaService.stop();

      if (mongo) {
        await mongo.stop({
          doCleanup: true,
        });
      }

      await testingModule.close();
    });

    it('should use MetadataScanner#scanFromPrototype when exploring', () => {
      expect(metadataScanner.scanFromPrototype).toHaveBeenCalled();
    });

    it('should invoke the decorated methods', () => {
      const jobsHandler = testingModule.get(JobsHandler);

      expect(jobsHandler.handled).toEqual(expect.arrayContaining([
        'OnQueReady',
        'OnJobStart',
        'test failure',
        'OnJobFail:test failure',
        'OnJobStart',
        'OnJobStart:testJob',
        'testJob',
        'OnJobSuccess:testJob',
        'OnJobComplete:testJob'
      ]));
    });
  });
});
