import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Processor } from 'agenda';
import { HandlerType } from '../enums';
import { AgendaMetadataAccessor } from './agenda-metadata.accessor';
import { JobOptions } from '../interfaces';
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
    const instanceWrappers: InstanceWrapper[] =
      this.discoveryService.getProviders();

    instanceWrappers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;

      if (!instance || !Object.getPrototypeOf(instance)) {
        return;
      }

      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key: string) =>
          wrapper.isDependencyTreeStatic()
            ? this.lookupHandlers(instance, key)
            : this.warnForNonStaticProviders(wrapper, instance, key),
      );
    });
  }

  private lookupHandlers(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];

    const metadata = this.metadataAccessor.getHandlerType(methodRef);

    switch (metadata) {
      case HandlerType.NOW:
      case HandlerType.EVERY:
      case HandlerType.SCHEDULE: {
        const jobMetadata: JobOptions =
          this.metadataAccessor.getJobMetadata(methodRef);

        // There must be a better way
        const jobProcessor: Processor & Record<'_name', string> =
          this.wrapFunctionInTryCatchBlocks(methodRef, instance);

        return this.orchestrator.addJobProcessor(
          jobProcessor,
          jobMetadata,
          metadata,
        );
      }
      case HandlerType.READY:
      case HandlerType.ERROR: {
        const eventHandler = this.wrapFunctionInTryCatchBlocks(
          methodRef,
          instance,
        );

        return this.orchestrator.addQueueEventHandler(eventHandler, metadata);
      }
      case HandlerType.START:
      case HandlerType.COMPLETE:
      case HandlerType.SUCCESS:
      case HandlerType.FAIL: {
        const eventHandler = this.wrapFunctionInTryCatchBlocks(
          methodRef,
          instance,
        );

        const jobName = this.metadataAccessor.getJobName(methodRef);

        return this.orchestrator.addQueueEventHandler(
          eventHandler,
          metadata,
          jobName,
        );
      }
      default:
        break;
    }
  }

  private warnForNonStaticProviders(
    wrapper: InstanceWrapper<any>,
    instance: Record<string, Function>,
    key: string,
  ) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getHandlerType(methodRef);

    switch (metadata) {
      case HandlerType.EVERY: {
        this.logger.warn(
          `Cannot register agenda job "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
    }
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
