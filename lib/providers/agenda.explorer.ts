import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Processor } from 'agenda';
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

              const jobProcessor = this.wrapFunctionInTryCatchBlocks(
                methodRef,
                instance as Processor<any>,
              ) as Processor<unknown>;

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
              ) as EventListener;

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

  private wrapFunctionInTryCatchBlocks(methodRef: Function, instance: unknown) {
    return new Proxy(methodRef, {
      apply: (target, thisArg, argArray) => {
        try {
          return target.call(instance, ...argArray);
        } catch (error) {
          this.logger.error(error);
          throw error;
        }
      },
      get: (target, propertyKey, receiver) => {
        if (propertyKey === 'name') {
          return methodRef.name;
        }

        // eslint-disable-next-line prefer-rest-params
        return Reflect.get(target, propertyKey, receiver);
      },
    });
  }
}
