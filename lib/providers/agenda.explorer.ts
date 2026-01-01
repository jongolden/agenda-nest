import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { JobAttributesData, Processor } from 'agenda-ts';
import { getQueueConfigToken, getQueueToken } from '../utils';
import { AgendaMetadataAccessor } from './agenda-metadata.accessor';
import { AgendaOrchestrator } from './agenda.orchestrator';

@Injectable()
export class AgendaExplorer implements OnModuleInit {
  private readonly logger = new Logger('Agenda');

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: AgendaMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
    private readonly orchestrator: AgendaOrchestrator,
  ) {}

  onModuleInit() {
    this.explore();
  }

  private explore() {
    this.discoveryService
      .getProviders()
      .filter((wrapper: InstanceWrapper) => {
        return this.metadataAccessor.isQueue(
          !wrapper.metatype || wrapper.inject
            ? wrapper?.constructor
            : wrapper.metatype,
        );
      })
      .forEach((wrapper: InstanceWrapper) => {
        const { instance, metatype } = wrapper;

        const { queueName } = this.metadataAccessor.getQueueMetadata(
          instance.constructor || metatype,
        );

        const queueToken = getQueueToken(queueName);

        const queueConfigToken = getQueueConfigToken(queueName);

        this.orchestrator.addQueue(queueName, queueToken, queueConfigToken);

        this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          (key: string) => {
            const methodRef = instance[key];

            if (this.metadataAccessor.isJobProcessor(methodRef)) {
              const jobProcessorType =
                this.metadataAccessor.getJobProcessorType(methodRef);

              const jobOptions =
                this.metadataAccessor.getJobProcessorMetadata(methodRef);

              const jobProcessor: Processor<JobAttributesData> &
                Record<'_name', string> = this.wrapFunctionInTryCatchBlocks(
                methodRef,
                instance,
              );

              this.orchestrator.addJobProcessor(
                queueToken,
                jobProcessor,
                jobOptions,
                jobProcessorType,
                methodRef.length === 2,
              );
            } else if (this.metadataAccessor.isEventListener(methodRef)) {
              const listener = this.wrapFunctionInTryCatchBlocks(
                methodRef,
                instance,
              );

              const eventName =
                this.metadataAccessor.getListenerMetadata(methodRef);

              const jobName = this.metadataAccessor.getJobName(methodRef);

              return this.orchestrator.addEventListener(
                queueToken,
                listener,
                eventName,
                jobName,
              );
            }
          },
        );
      });
  }

  private wrapFunctionInTryCatchBlocks(methodRef: Function, instance: object) {
    const handler = (...args: unknown[]) => {
      try {
        return methodRef.call(instance, ...args);
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    };

    handler._name = methodRef.name;

    return handler;
  }
}
