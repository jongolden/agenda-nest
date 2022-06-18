import { ModuleMetadata, Type, FactoryProvider, Provider } from '@nestjs/common';
import { AgendaConfig } from 'agenda';

export type AgendaModuleConfig = AgendaConfig & { global?: boolean };

export interface AgendaConfigFactory {
  createAgendaConfig(): Promise<AgendaModuleConfig> | AgendaModuleConfig;
}

export interface AgendaModuleAsyncConfig extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AgendaConfigFactory>;
  useClass?: Type<AgendaConfigFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<AgendaModuleConfig> | AgendaModuleConfig;
  inject?: FactoryProvider['inject'];
  extraProviders?: Provider[];
}
