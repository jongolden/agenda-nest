import { Module } from '@nestjs/common';
import { AgendaModule } from 'agenda-nest';
import { NotificationsQueue } from './notifications.queue';

@Module({
  imports: [
    AgendaModule.registerQueue('notifications'),
  ],
  providers: [NotificationsQueue],
})
export class NotificationsModule {}
