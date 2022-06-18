import { applyDecorators, SetMetadata } from '@nestjs/common';
import { AGENDA_HANDLER_TYPE, AGENDA_JOB_OPTIONS } from '../constants';
import { HandlerType } from '../enums';
import { JobOptions } from '../interfaces/job-options.interface';

export function Every(interval: string): MethodDecorator;
export function Every(options: JobOptions): MethodDecorator;
export function Every(intervalOrOptions: string | JobOptions): MethodDecorator {
  const options =
    typeof intervalOrOptions === 'string'
      ? { interval: intervalOrOptions }
      : intervalOrOptions;

  return applyDecorators(
    SetMetadata(AGENDA_JOB_OPTIONS, options),
    SetMetadata(AGENDA_HANDLER_TYPE, HandlerType.EVERY),
  );
}
