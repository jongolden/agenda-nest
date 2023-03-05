import {
  DynamicModule,
  InjectionToken,
  Module,
  Provider,
  Type,
} from '@nestjs/common';
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
    const providers = this.createAsyncProviders<AgendaModuleConfig>(
      AGENDA_MODULE_CONFIG,
      config,
    );

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
    const queueConfigToken = getQueueConfigToken(name);

    const providers = [
      {
        provide: queueConfigToken,
        useValue: { autoStart: true, ...config },
      },
      {
        provide: getQueueToken(name),
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

  static registerQueueAsync(
    name: string,
    config: AgendaModuleAsyncConfig<AgendaQueueConfig>,
  ): DynamicModule {
    const queueConfigToken = getQueueConfigToken(name);

    const providers = [
      {
        provide: getQueueToken(name),
        useFactory: agendaFactory,
        inject: [queueConfigToken, AGENDA_MODULE_CONFIG],
      },
      ...this.createAsyncProviders<AgendaQueueConfig>(queueConfigToken, config),
    ];

    return {
      module: AgendaModule,
      imports: config.imports || [],
      providers: [...providers, ...(config.extraProviders || [])],
      exports: providers,
    };
  }

  private static createAsyncProviders<T>(
    token: InjectionToken,
    config: AgendaModuleAsyncConfig<T>,
  ): Provider[] {
    if (config.useExisting || config.useFactory) {
      return [this.createAsyncOptionsProvider(token, config)];
    }

    const useClass = config.useClass as Type<AgendaConfigFactory<T>>;

    return [
      this.createAsyncOptionsProvider<T>(token, config),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider<T>(
    token: InjectionToken,
    config: AgendaModuleAsyncConfig<T>,
  ): Provider {
    if (config.useFactory) {
      return {
        provide: token,
        useFactory: config.useFactory,
        inject: config.inject || [],
      };
    }

    const inject = [
      (config.useClass || config.useExisting) as Type<AgendaConfigFactory<T>>,
    ];

    return {
      provide: token,
      useFactory: async (optionsFactory: AgendaConfigFactory<T>) =>
        optionsFactory.createAgendaConfig(),
      inject,
    };
  }
}
