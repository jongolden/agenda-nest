import { AgendaConfig } from 'agenda';
import { Db, MongoClient } from 'mongodb';

export async function databaseFactory(config: AgendaConfig): Promise<Db> {
  if (config.mongo) {
    return config.mongo;
  }

  const mongo = new MongoClient(
    config.db?.address as string,
    config.db?.options,
  );

  await mongo.connect();

  return mongo.db();
}
