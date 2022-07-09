import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ON_QUEUE_EVENT, JOB_NAME } from '../constants';
import { AgendaQueueEvent } from '../enums';

export const OnQueueEvent = (
  type: AgendaQueueEvent,
  jobName?: string,
): MethodDecorator =>
  applyDecorators(
    SetMetadata(ON_QUEUE_EVENT, type),
    SetMetadata(JOB_NAME, jobName),
  );

export const OnQueueReady = () => OnQueueEvent(AgendaQueueEvent.READY);

export const OnQueueError = () => OnQueueEvent(AgendaQueueEvent.ERROR);

export const OnJobStart = (jobName?: string) =>
  OnQueueEvent(AgendaQueueEvent.START, jobName);

export const OnJobComplete = (jobName?: string) =>
  OnQueueEvent(AgendaQueueEvent.COMPLETE, jobName);

export const OnJobSuccess = (jobName?: string) =>
  OnQueueEvent(AgendaQueueEvent.SUCCESS, jobName);

export const OnJobFail = (jobName?: string) =>
  OnQueueEvent(AgendaQueueEvent.FAIL, jobName);
