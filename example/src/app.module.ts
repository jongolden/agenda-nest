import { Module } from '@nestjs/common';
import { AgendaModule } from 'agenda-nest';
import { Tasks } from './tasks.';

@Module({
  imports: [
    AgendaModule.register({
      db: {
        address: 'mongodb://localhost:27017',
        collection: 'agenda-queue',
      },
    }),
  ],
  providers: [Tasks],
})
export class AppModule {}
