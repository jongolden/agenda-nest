import { Module } from '@nestjs/common';
import { AgendaModule } from 'agenda-nest';
import { MongoClient, Db } from 'mongodb';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';

const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    console.log('here');
    const client = new MongoClient('mongodb://localhost:27017');
    console.log('connecting');
    await client.connect();

    console.log('connected');

    return client.db();
  },
}

@Module({
  imports: [
    AgendaModule.forRootAsync({
      useFactory: (mongo: Db) => ({
        mongo,
      }),
      inject: ['DATABASE_CONNECTION'],
      extraProviders: [databaseProvider],
    }),
    NotificationsModule,
    ReportsModule,
  ],
  providers: [databaseProvider],
})
export class AppModule {}
