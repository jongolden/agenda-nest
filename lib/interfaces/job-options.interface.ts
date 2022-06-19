import {
  DefineOptions as AgendaDefineOptions,
  JobOptions as AgendaJobOptions,
} from 'agenda';

export type JobOptions = AgendaDefineOptions &
  AgendaJobOptions & { name?: string };
