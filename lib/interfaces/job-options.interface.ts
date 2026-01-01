import {
  DefineOptions as AgendaDefineOptions,
  JobOptions as AgendaJobOptions,
} from 'agenda-ts';

export type JobOptions = AgendaDefineOptions &
  AgendaJobOptions & { name?: string };
