import { applyDecorators, SetMetadata } from '@nestjs/common';
import { AGENDA_HANDLER_TYPE, AGENDA_JOB_NAME } from '../constants';
import { HandlerType } from '../enums';

export const OnQueueEvent = (type: HandlerType, jobName?: string): MethodDecorator => applyDecorators(
  SetMetadata(AGENDA_HANDLER_TYPE, type),
  SetMetadata(AGENDA_JOB_NAME, jobName),
);

export const OnQueueReady = () => OnQueueEvent(HandlerType.READY);

export const OnQueueError = () => OnQueueEvent(HandlerType.ERROR);

export const OnJobStart = (jobName?: string) => OnQueueEvent(HandlerType.START, jobName);

export const OnJobComplete = (jobName?: string) => OnQueueEvent(HandlerType.COMPLETE, jobName);

export const OnJobSuccess = (jobName?: string) => OnQueueEvent(HandlerType.SUCCESS, jobName);

export const OnJobFail = (jobName?: string) => OnQueueEvent(HandlerType.FAIL, jobName);
