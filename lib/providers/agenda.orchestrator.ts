import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Agenda, { AgendaConfig, Processor } from 'agenda';
import { NO_QUEUE_FOUND } from '../agenda.messages';
import {
  AgendaModuleJobOptions,
  NonRepeatableJobOptions,
  RepeatableJobOptions,
} from '../decorators';
import { JobProcessorType } from '../enums';

type JobProcessorConfig = {
  handler: Processor;
  type: JobProcessorType;
  options: RepeatableJobOptions | NonRepeatableJobOptions;
};

export type EventListener = (...args: any[]) => void;

type QueueRegistry = {
  config: AgendaConfig;
  processors: Map<string, JobProcessorConfig>;
  listeners: Map<string, EventListener>;
  queue: Agenda;
};

@Injectable()
export class AgendaOrchestrator
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger('Agenda');

  private readonly queues: Map<string, QueueRegistry> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  private attachEventListeners(agenda: Agenda, registry: QueueRegistry) {
    registry.listeners.forEach((listener: EventListener, eventName: string) => {
      agenda.on(eventName, listener);
    });
  }

  private defineJobProcessors(agenda: Agenda, registry: QueueRegistry) {
    registry.processors.forEach(
      (jobConfig: JobProcessorConfig, jobName: string) => {
        const { options, handler } = jobConfig;

        agenda.define(jobName, options, handler);
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

  private getQueue(queueToken: string, queueName: string): Agenda {
    try {
      return this.moduleRef.get<Agenda>(queueToken, { strict: false });
    } catch (error) {
      this.logger.error(NO_QUEUE_FOUND(queueName));
      throw error;
    }
  }

  async onApplicationBootstrap() {
    for await (const queue_ of this.queues) {
      const [, registry] = queue_;

      const { queue } = registry;

      this.attachEventListeners(queue, registry);

      await queue.start();

      this.defineJobProcessors(queue, registry);

      await this.scheduleJobs(queue, registry);
    }
  }

  async onApplicationShutdown() {
    for await (const queue of this.queues) {
      const [, config] = queue;

      await config.queue.stop();
    }
  }

  addQueue(queueName: string, queueToken: string, config: AgendaConfig) {
    const queue = this.getQueue(queueToken, queueName);

    this.queues.set(queueToken, {
      config,
      processors: new Map(),
      listeners: new Map(),
      queue,
    });
  }

  addJobProcessor(
    queueToken: string,
    processor: Processor & Record<'_name', string>,
    options: AgendaModuleJobOptions,
    type: JobProcessorType,
  ) {
    const jobName = options.name || processor._name;

    this.queues.get(queueToken)?.processors.set(jobName, {
      handler: processor,
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
}
