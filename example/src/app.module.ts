import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AgendaModule, AgendaService } from 'agenda-nest';
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
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    const agenda = this.moduleRef.get(AgendaService, { strict: false });

    await agenda._ready;

    agenda.now('defined job', {});
  }
}
