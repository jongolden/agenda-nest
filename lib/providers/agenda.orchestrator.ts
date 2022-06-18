import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Processor } from 'agenda';
import { JobOptions } from '../interfaces';
import { AgendaService } from './agenda.service';

type JobProcessorConfig = {
  handler: Processor;
  options: JobOptions;
}

export type EventHandler = (...args: any[]) => void;

@Injectable()
export class AgendaOrchestrator implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly jobProcessors: Map<string, JobProcessorConfig> = new Map();
  private readonly queueEventHandlers: Map<string, EventHandler> = new Map();

  constructor(private readonly agendaService: AgendaService) {}

  async onApplicationBootstrap() {
    this.attachQueueListeners();

    this.defineJobProcessors();

    await this.agendaService.start();

    this.scheduleJobs();
  }

  async onApplicationShutdown() {
    await this.agendaService.stop();
  }

  private defineJobProcessors() {
    this.jobProcessors.forEach((config: JobProcessorConfig, name: string) => {
      this.agendaService.define(name, config.options, config.handler);
    });
  }

  private scheduleJobs() {
    this.jobProcessors.forEach((config: JobProcessorConfig, name: string) => {
      this.agendaService.every(config.options.interval as string, name, {}, config.options);
    });
  }

  private attachQueueListeners() {
    this.queueEventHandlers.forEach((handler: EventHandler, eventName: string) => {
      this.agendaService.on(eventName, handler);
    });
  }

  addJobProcessor(processor: Processor & Record<'_name', string>, options: JobOptions) {
    const jobName = options.name || processor._name;

    this.jobProcessors.set(jobName, {
      handler: processor,
      options,
    });
  }

  addQueueEventHandler(handler: EventHandler, eventName: string, jobName?: string) {
    const key = jobName ? `${eventName}:${jobName}` : eventName;

    this.queueEventHandlers.set(key, handler);
  }
}
