import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AGENDA_MODULE_CONFIG } from './constants';
import { agendaFactory } from './factories';
import {
  AgendaConfigFactory,
  AgendaModuleAsyncConfig,
  AgendaModuleConfig,
  AgendaQueueConfig,
} from './interfaces';
import { AgendaExplorer, AgendaMetadataAccessor } from './providers';
import { AgendaOrchestrator } from './providers/agenda.orchestrator';
import { DatabaseService } from './providers/database.service';
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
      DatabaseService,
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
        DatabaseService,
        AgendaMetadataAccessor,
        AgendaExplorer,
        AgendaOrchestrator,
        ...(config.extraProviders || []),
      ],
      exports: providers,
    };
  }

  static registerQueue(
    name: string,
    config: AgendaQueueConfig = {},
  ): DynamicModule {
    const queueToken = getQueueToken(name);

    const queueConfigToken = getQueueConfigToken(name);

    const configDefaults = {
      autoStart: true,
    };

    const providers: Provider[] = [
      {
        provide: queueConfigToken,
        useValue: { ...configDefaults, ...config },
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
