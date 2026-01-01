import { Inject, Injectable } from '@nestjs/common';
import { AgendaConfig } from 'agenda-ts';
import { Db, MongoClient } from 'mongodb';
import { AGENDA_MODULE_CONFIG } from '../constants';

@Injectable()
export class DatabaseService {
  private connection!: Db;
  private client?: MongoClient;

  constructor(
    @Inject(AGENDA_MODULE_CONFIG) private readonly config: AgendaConfig,
  ) {
    if (config.mongo) {
      this.connection = config.mongo;
    } else {
      this.client = new MongoClient(
        config.db?.address as string,
        config.db?.options,
      );
    }
  }

  async connect() {
    if (!this.connection) {
      this.client = new MongoClient(
        this.config.db?.address as string,
        this.config.db?.options,
      );

      await this.client.connect();

      this.connection = this.client.db();
    }
  }

  getConnection() {
    return this.connection;
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // Client may already be closed
      }
    }
  }
}
