import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Agenda from 'agenda-ts';
import { AgendaModule } from 'agenda-nest';
import { NotificationsQueue } from './notifications.queue';

@Module({
  imports: [
    AgendaModule.registerQueue('notifications', {
      autoStart: false,
    }),
  ],
  providers: [NotificationsQueue],
})
export class NotificationsModule implements OnApplicationBootstrap {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    const queue = this.moduleRef.get<Agenda>('notifications-queue', { strict: false });
    await queue.start();
  }

}
