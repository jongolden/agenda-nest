import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgendaModule } from 'agenda-nest';
import { ReportsQueue } from './reports.queue';

@Module({
  imports: [
    AgendaModule.registerQueueAsync('reports', {
      useFactory: (config: ConfigService) => {
        const autoStart = config.get<string>('AUTO_START_QUEUE');

        return {
          autoStart: autoStart === 'true',
        };
      },
      inject: [ConfigService]
    }),
  ],
  providers: [ReportsQueue],
})
export class ReportsModule {}
