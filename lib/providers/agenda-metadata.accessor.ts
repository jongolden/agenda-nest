import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AGENDA_HANDLER_TYPE, AGENDA_JOB_NAME, AGENDA_JOB_OPTIONS } from '../constants';
import { HandlerType } from '../enums';
import { JobOptions } from '../interfaces';

@Injectable()
export class AgendaMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getHandlerType(target: Function): HandlerType {
    return this.reflector.get(AGENDA_HANDLER_TYPE, target);
  }

  getJobName(target: Function): string | undefined {
    return this.reflector.get(AGENDA_JOB_NAME, target);
  }

  getJobMetadata(target: Function): JobOptions {
    return this.reflector.get(AGENDA_JOB_OPTIONS, target);
  }
}
