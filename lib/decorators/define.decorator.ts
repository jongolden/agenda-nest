import { applyDecorators, SetMetadata } from '@nestjs/common';
import { DefineOptions } from 'agenda';
import { AGENDA_HANDLER_TYPE, AGENDA_JOB_OPTIONS } from '../constants';
import { HandlerType } from '../enums';

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
    SetMetadata(AGENDA_HANDLER_TYPE, HandlerType.DEFINE),
  );
}
