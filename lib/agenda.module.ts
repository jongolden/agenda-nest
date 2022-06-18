import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import Agenda from 'agenda';
import { AGENDA_MODULE_CONFIG } from './constants';
import { AgendaConfigFactory, AgendaModuleAsyncConfig, AgendaModuleConfig } from './interfaces';
import { AgendaExplorer, AgendaMetadataAccessor, AgendaService } from './providers';
import { AgendaOrchestrator } from './providers/agenda.orchestrator';

@Module({
  imports: [DiscoveryModule],
  providers: [
    AgendaMetadataAccessor,
    AgendaExplorer,
    AgendaOrchestrator,
    {
      provide: AgendaService,
      useFactory: (config: AgendaModuleConfig) => new Agenda(config),
      inject: [AGENDA_MODULE_CONFIG],
    },
  ],
})
export class AgendaModule {
  static register(config: AgendaModuleConfig): DynamicModule {
    return {
      module: AgendaModule,
      providers: [
        {
          provide: AGENDA_MODULE_CONFIG,
          useValue: config,
        },
      ],
    };
  }

  static registerAsync(config: AgendaModuleAsyncConfig): DynamicModule {
    return {
      module: AgendaModule,
      imports: config.imports || [],
      providers: [
        ...this.createAsyncProviders(config),
        ...(config.extraProviders || []),
      ]
    };
  }

  private static createAsyncProviders(config: AgendaModuleAsyncConfig): Provider[] {
    if (config.useExisting || config.useFactory) {
      return [this.createAsyncOptionsProvider(config)];
    }

    const useClass = config.useClass as Type<AgendaConfigFactory>;

    return [
      this.createAsyncOptionsProvider(config),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(config: AgendaModuleAsyncConfig): Provider {
    if (config.useFactory) {
      return {
        provide: AGENDA_MODULE_CONFIG,
        useFactory: config.useFactory,
        inject: config.inject || [],
      };
    }

    const inject = [
      (config.useClass || config.useExisting) as Type<AgendaConfigFactory>,
    ];

    return {
      provide: AGENDA_MODULE_CONFIG,
      useFactory: async (optionsFactory: AgendaConfigFactory) =>
        optionsFactory.createAgendaConfig(),
      inject,
    };
  }
}
