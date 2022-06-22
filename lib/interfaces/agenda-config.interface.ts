import {
  ModuleMetadata,
  Type,
  FactoryProvider,
  Provider,
} from '@nestjs/common';
import { AgendaConfig } from 'agenda';

export type AgendaModuleConfig = AgendaConfig;

export type AgendaQueueConfig = Omit<AgendaModuleConfig, 'mongo' | 'db'> & {
  queue: string;
};

export interface AgendaConfigFactory<T> {
  createAgendaConfig(): Promise<T> | T;
}

export interface AgendaModuleAsyncConfig<T>
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AgendaConfigFactory<T>>;
  useClass?: Type<AgendaConfigFactory<T>>;
  useFactory?: (...args: any[]) => Promise<T> | T;
  inject?: FactoryProvider['inject'];
  extraProviders?: Provider[];
}
