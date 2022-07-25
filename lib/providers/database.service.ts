import { Inject, Injectable } from '@nestjs/common';
import { AgendaConfig } from 'agenda';
import { Db, MongoClient } from 'mongodb';
import { AGENDA_MODULE_CONFIG } from '../constants';

@Injectable()
export class DatabaseService {
  private connection!: Db;
  private client: MongoClient;

  constructor(@Inject(AGENDA_MODULE_CONFIG) config: AgendaConfig) {
    if (config.mongo) {
      this.connection = config.mongo;
    }

    this.client = new MongoClient(
      config.db?.address as string,
      config.db?.options,
    );
  }

  async getConnection() {
    if (!this.connection) {
      await this.client.connect();
      this.connection = this.client.db();
    }

    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.client.close();
    }
  }
}
