import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Agenda, {
  AgendaConfig,
  AgendaOnEventType,
  DefineOptions,
  Job,
  JobAttributesData,
  Processor,
} from 'agenda-ts';
import { NO_QUEUE_FOUND } from '../agenda.messages';
import {
  AgendaModuleJobOptions,
  NonRepeatableJobOptions,
  RepeatableJobOptions,
} from '../decorators';
import { JobProcessorType } from '../enums';
import { AgendaQueueConfig } from '../interfaces';
import { DatabaseService } from './database.service';

type JobProcessorConfig = {
  handler: Processor<JobAttributesData>;
  type: JobProcessorType;
  options: RepeatableJobOptions | NonRepeatableJobOptions;
  useCallback: boolean;
};

type EventListener = (...args: unknown[]) => void;

type QueueRegistry = {
  config: AgendaQueueConfig;
  processors: Map<string, JobProcessorConfig>;
  listeners: Map<string, EventListener>;
  queue: Agenda;
};

@Injectable()
export class AgendaOrchestrator
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger('Agenda');

  private readonly queues: Map<string, QueueRegistry> = new Map();

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly database: DatabaseService,
  ) {}

  async onApplicationBootstrap() {
    await this.database.connect();

    for await (const queue_ of this.queues) {
      const [queueToken, registry] = queue_;

      const { config, queue } = registry;

      this.attachEventListeners(queue, registry);

      // Add default error handler to prevent unhandled errors during shutdown
      queue.on('error', (error) => {
        this.logger.error(error);
      });

      queue.mongo(
        this.database.getConnection(),
        config.collection || queueToken,
      );

      if (config.autoStart) {
        await queue.start();
      }

      this.defineJobProcessors(queue, registry);

      await this.scheduleJobs(queue, registry);
    }
  }

  async beforeApplicationShutdown() {
    for await (const queue of this.queues) {
      const [, registry] = queue;

      try {
        await registry.queue.stop();
        // Wait for running jobs to complete
        await registry.queue.drain();
      } catch {
        // Queue may not have been started or already stopped
      }
    }

    await this.database.disconnect();
  }

  addQueue(queueName: string, queueToken: string, queueConfigToken: string) {
    const queue = this.getQueue(queueName, queueToken);
    const config = this.getQueueConfig(queueConfigToken);

    this.queues.set(queueToken, {
      queue,
      config,
      processors: new Map(),
      listeners: new Map(),
    });
  }

  addJobProcessor(
    queueToken: string,
    processor: Processor<JobAttributesData> & Record<'_name', string>,
    options: AgendaModuleJobOptions,
    type: JobProcessorType,
    useCallback: boolean,
  ) {
    const jobName = options.name || processor._name;

    this.queues.get(queueToken)?.processors.set(jobName, {
      handler: processor,
      useCallback,
      type,
      options,
    });
  }

  addEventListener(
    queueToken: string,
    listener: EventListener,
    eventName: string,
    jobName?: string,
  ) {
    const key = jobName ? `${eventName}:${jobName}` : eventName;

    this.queues.get(queueToken)?.listeners.set(key, listener);
  }

  private attachEventListeners(agenda: Agenda, registry: QueueRegistry) {
    registry.listeners.forEach((listener: EventListener, eventName: string) => {
      // agenda-ts emits job-specific events like 'start:jobName' but their types don't include them
      agenda.on(eventName as AgendaOnEventType, listener);
    });
  }

  private defineJobProcessors(agenda: Agenda, registry: QueueRegistry) {
    registry.processors.forEach(
      (jobConfig: JobProcessorConfig, jobName: string) => {
        const { options, handler, useCallback } = jobConfig;

        if (useCallback) {
          agenda.define(
            jobName,
            (job: Job<JobAttributesData>, done: () => void) => {
              return handler(job, done);
            },
            options as DefineOptions,
          );
        } else {
          agenda.define(jobName, handler, options as DefineOptions);
        }
      },
    );
  }

  private async scheduleJobs(agenda: Agenda, registry: QueueRegistry) {
    for await (const processor of registry.processors) {
      const [jobName, jobConfig] = processor;

      const { type, options } = jobConfig;

      if (type === JobProcessorType.EVERY) {
        await agenda.every(
          (options as RepeatableJobOptions).interval,
          jobName,
          {},
          options,
        );
      } else if (type === JobProcessorType.SCHEDULE) {
        await agenda.schedule(
          (options as NonRepeatableJobOptions).when,
          jobName,
          {},
        );
      } else if (type === JobProcessorType.NOW) {
        await agenda.now(jobName, {});
      }
    }
  }

  private getQueue(queueName: string, queueToken: string): Agenda {
    try {
      return this.moduleRef.get<Agenda>(queueToken, { strict: false });
    } catch (error) {
      this.logger.error(NO_QUEUE_FOUND(queueName));
      throw error;
    }
  }

  private getQueueConfig(queueConfigToken: string): AgendaConfig {
    return this.moduleRef.get<AgendaConfig>(queueConfigToken, {
      strict: false,
    });
  }
}
