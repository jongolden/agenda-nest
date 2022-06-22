import { Module } from '@nestjs/common';
import { AgendaModule } from 'agenda-nest';
import { ReportsQueue } from './reports.queue';

@Module({
  imports: [
    AgendaModule.registerQueue('reports'),
  ],
  providers: [ReportsQueue],
})
export class ReportsModule {}
