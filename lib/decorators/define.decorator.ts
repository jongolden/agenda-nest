import { applyDecorators, SetMetadata } from '@nestjs/common';
import { DefineOptions } from 'agenda-ts';
import { JOB_PROCESSOR_TYPE, AGENDA_JOB_OPTIONS } from '../constants';
import { JobProcessorType } from '../enums';

type NameAndDefineOptions = DefineOptions & Record<'name', string>;

export function Define(name?: string): MethodDecorator;
export function Define(options?: NameAndDefineOptions): MethodDecorator;
export function Define(
  nameOrOptions?: string | NameAndDefineOptions,
): MethodDecorator {
  let options = {};

  if (nameOrOptions) {
    options =
      typeof nameOrOptions === 'string'
        ? { name: nameOrOptions }
        : nameOrOptions;
  }

  return applyDecorators(
    SetMetadata(AGENDA_JOB_OPTIONS, options),
    SetMetadata(JOB_PROCESSOR_TYPE, JobProcessorType.DEFINE),
  );
}
