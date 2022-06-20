import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import Agenda from 'agenda';
import { AGENDA_MODULE_CONFIG } from './constants';
import {
  AgendaConfigFactory,
  AgendaModuleAsyncConfig,
  AgendaModuleConfig,
  AgendaQueueConfig,
} from './interfaces';
import { AgendaExplorer, AgendaMetadataAccessor } from './providers';
import { AgendaOrchestrator } from './providers/agenda.orchestrator';
import { getQueueToken } from './utils';

@Module({
  imports: [DiscoveryModule],
  providers: [AgendaMetadataAccessor, AgendaExplorer, AgendaOrchestrator],
})
export class AgendaModule {
  static forRoot(config: AgendaModuleConfig): DynamicModule {
    const configProvider: Provider = {
      provide: AGENDA_MODULE_CONFIG,
      useValue: config,
    };

    return {
      global: true,
      module: AgendaModule,
      providers: [configProvider],
      exports: [configProvider],
    };
  }

  static forRootAsync(
    config: AgendaModuleAsyncConfig<AgendaModuleConfig>,
  ): DynamicModule {
    const providers = this.createAsyncProviders<AgendaModuleConfig>(config);

    return {
      global: true,
      module: AgendaModule,
      imports: config.imports || [],
      providers: [...providers, ...(config.extraProviders || [])],
      exports: providers,
    };
  }

  static forFeature(config: AgendaQueueConfig): DynamicModule {
    const queueToken = getQueueToken(config.queue);

    const providers = [
      {
        provide: queueToken,
        useFactory: (rootConfig: AgendaModuleConfig) =>
          new Agenda({
            ...rootConfig,
            ...config,
            ...{
              db: {
                address: config.db?.address || rootConfig.db?.address || '',
                collection: queueToken,
              },
            },
          }),
        inject: [AGENDA_MODULE_CONFIG],
      },
    ];

    return {
      module: AgendaModule,
      imports: [AgendaModule.registerCore()],
      providers,
      exports: providers,
    };
  }

  private static registerCore() {
    return {
      global: true,
      module: AgendaModule,
      imports: [DiscoveryModule],
      providers: [AgendaMetadataAccessor, AgendaExplorer, AgendaOrchestrator],
    };
  }

  private static createAsyncProviders<T>(
    config: AgendaModuleAsyncConfig<T>,
  ): Provider[] {
    if (config.useExisting || config.useFactory) {
      return [this.createAsyncOptionsProvider(config)];
    }

    const useClass = config.useClass as Type<AgendaConfigFactory<T>>;

    return [
      this.createAsyncOptionsProvider<T>(config),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider<T>(
    config: AgendaModuleAsyncConfig<T>,
  ): Provider {
    if (config.useFactory) {
      return {
        provide: AGENDA_MODULE_CONFIG,
        useFactory: config.useFactory,
        inject: config.inject || [],
      };
    }

    const inject = [
      (config.useClass || config.useExisting) as Type<AgendaConfigFactory<T>>,
    ];

    return {
      provide: AGENDA_MODULE_CONFIG,
      useFactory: async (optionsFactory: AgendaConfigFactory<T>) =>
        optionsFactory.createAgendaConfig(),
      inject,
    };
  }
}
