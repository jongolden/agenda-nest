import { SetMetadata, Type } from '@nestjs/common';
import { AgendaConfig } from 'agenda';
import { AGENDA_MODULE_QUEUE } from '../constants';

export function Queue(): ClassDecorator;
export function Queue(name: string): ClassDecorator;
export function Queue(config: AgendaConfig): ClassDecorator;
export function Queue(nameOrConfig?: string | AgendaConfig): ClassDecorator {
  const agendaConfig = nameOrConfig
    ? typeof nameOrConfig === 'string'
      ? { queueName: nameOrConfig }
      : nameOrConfig
    : {};

  return (target: Type<any> | Function) => {
    SetMetadata(AGENDA_MODULE_QUEUE, agendaConfig)(target);
  };
}
