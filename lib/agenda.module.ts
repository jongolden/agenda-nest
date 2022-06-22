import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AGENDA_MODULE_CONFIG, DATABASE_CONNECTION } from './constants';
import { agendaFactory, databaseFactory } from './factories';
import {
  AgendaConfigFactory,
  AgendaModuleAsyncConfig,
  AgendaModuleConfig,
  AgendaQueueConfig,
} from './interfaces';
import { AgendaExplorer, AgendaMetadataAccessor } from './providers';
import { AgendaOrchestrator } from './providers/agenda.orchestrator';
import { getQueueConfigToken, getQueueToken } from './utils';

@Module({
  imports: [DiscoveryModule],
  providers: [],
})
export class AgendaModule {
  static forRoot(config: AgendaModuleConfig): DynamicModule {
    const configProviders: Provider[] = [
      {
        provide: AGENDA_MODULE_CONFIG,
        useValue: config,
      },
      {
        provide: DATABASE_CONNECTION,
        useFactory: databaseFactory,
        inject: [AGENDA_MODULE_CONFIG],
      },
      AgendaMetadataAccessor,
      AgendaExplorer,
      AgendaOrchestrator,
    ];

    return {
      global: true,
      module: AgendaModule,
      providers: configProviders,
      exports: configProviders,
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
      providers: [
        ...providers,
        AgendaMetadataAccessor,
        AgendaExplorer,
        AgendaOrchestrator,
        ...(config.extraProviders || []),
      ],
      exports: providers,
    };
  }

  static forFeature(config: AgendaQueueConfig): DynamicModule {
    const queueToken = getQueueToken(config.queue);

    const queueConfigToken = getQueueConfigToken(config.queue);

    const providers = [
      {
        provide: queueConfigToken,
        useValue: config,
      },
      {
        provide: queueToken,
        useFactory: agendaFactory,
        inject: [queueConfigToken, AGENDA_MODULE_CONFIG],
      },
    ];

    return {
      module: AgendaModule,
      providers,
      exports: providers,
    };
  }

  private static createAsyncProviders<T>(
    config: AgendaModuleAsyncConfig<T>,
  ): Provider[] {
    if (config.useExisting || config.useFactory) {
      return [
        this.createAsyncOptionsProvider(config),
        {
          provide: DATABASE_CONNECTION,
          useFactory: databaseFactory,
          inject: [AGENDA_MODULE_CONFIG],
        },
      ];
    }

    const useClass = config.useClass as Type<AgendaConfigFactory<T>>;

    return [
      this.createAsyncOptionsProvider<T>(config),
      {
        provide: useClass,
        useClass,
      },
      {
        provide: DATABASE_CONNECTION,
        useFactory: databaseFactory,
        inject: [AGENDA_MODULE_CONFIG],
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
