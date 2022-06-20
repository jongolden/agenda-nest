import { applyDecorators, SetMetadata } from '@nestjs/common';
import { JOB_PROCESSOR_TYPE, AGENDA_JOB_OPTIONS } from '../constants';
import { JobProcessorType } from '../enums';
import { JobOptions } from '../interfaces/job-options.interface';

export type RepeatableJobOptions = JobOptions & Record<'interval', string>;

export type NonRepeatableJobOptions = JobOptions &
  Record<'when', string | Date>;

export type AgendaModuleJobOptions =
  | RepeatableJobOptions
  | NonRepeatableJobOptions;

export function Every(interval: string): MethodDecorator;
export function Every(options: RepeatableJobOptions): MethodDecorator;
export function Every(
  intervalOrOptions: string | RepeatableJobOptions,
): MethodDecorator {
  const options =
    typeof intervalOrOptions === 'string'
      ? { interval: intervalOrOptions }
      : intervalOrOptions;

  return applyDecorators(
    SetMetadata(AGENDA_JOB_OPTIONS, options),
    SetMetadata(JOB_PROCESSOR_TYPE, JobProcessorType.EVERY),
  );
}

export function Schedule(when: string): MethodDecorator;
export function Schedule(options: NonRepeatableJobOptions): MethodDecorator;
export function Schedule(whenOrOptions: string | NonRepeatableJobOptions) {
  const options =
    typeof whenOrOptions === 'string' ? { when: whenOrOptions } : whenOrOptions;

  return applyDecorators(
    SetMetadata(AGENDA_JOB_OPTIONS, options),
    SetMetadata(JOB_PROCESSOR_TYPE, JobProcessorType.SCHEDULE),
  );
}

export function Now(name?: string): MethodDecorator {
  const options = { name };

  return applyDecorators(
    SetMetadata(AGENDA_JOB_OPTIONS, options),
    SetMetadata(JOB_PROCESSOR_TYPE, JobProcessorType.NOW),
  );
}
