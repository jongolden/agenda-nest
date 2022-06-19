import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Processor } from 'agenda';
import { NonRepeatableJobOptions, RepeatableJobOptions } from '../decorators';
import { HandlerType } from '../enums';
import { JobOptions } from '../interfaces';
import { AgendaService } from './agenda.service';

type JobProcessorType =
  | HandlerType.EVERY
  | HandlerType.SCHEDULE
  | HandlerType.NOW;

type JobProcessorConfig = {
  handler: Processor;
  type: JobProcessorType;
  options: JobOptions;
};

export type EventHandler = (...args: any[]) => void;

@Injectable()
export class AgendaOrchestrator
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly jobProcessors: Map<string, JobProcessorConfig> = new Map();
  private readonly queueEventHandlers: Map<string, EventHandler> = new Map();

  constructor(private readonly agendaService: AgendaService) {}

  // TODO: clean this up
  private async scheduleJobs() {
    for await (const [name, config] of this.jobProcessors.entries()) {
      if (config.type === HandlerType.NOW) {
        await this.agendaService.now(name, {});
      } else if (config.type === HandlerType.EVERY) {
        await this.agendaService.every(
          (config.options as RepeatableJobOptions).interval,
          name,
          {},
          config.options,
        );
      } else if (config.type === HandlerType.SCHEDULE) {
        await this.agendaService.schedule(
          (config.options as NonRepeatableJobOptions).when,
          name,
          {},
        );
      }
    }
  }

  private attachQueueListeners() {
    this.queueEventHandlers.forEach(
      (handler: EventHandler, eventName: string) => {
        this.agendaService.on(eventName, handler);
      },
    );
  }

  async onApplicationBootstrap() {
    this.attachQueueListeners();

    this.defineJobProcessors();

    await this.agendaService.start();

    await this.scheduleJobs();
  }

  async onApplicationShutdown() {
    await this.agendaService.stop();
  }

  private defineJobProcessors() {
    this.jobProcessors.forEach((config: JobProcessorConfig, name: string) => {
      this.agendaService.define(name, config.options, config.handler);
    });
  }

  addJobProcessor(
    processor: Processor & Record<'_name', string>,
    options: JobOptions,
    type: JobProcessorType,
  ) {
    const jobName = options.name || processor._name;

    this.jobProcessors.set(jobName, {
      handler: processor,
      type,
      options,
    });
  }

  addQueueEventHandler(
    handler: EventHandler,
    eventName: string,
    jobName?: string,
  ) {
    const key = jobName ? `${eventName}:${jobName}` : eventName;

    this.queueEventHandlers.set(key, handler);
  }
}
