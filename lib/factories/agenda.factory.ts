import Agenda, { AgendaConfig } from 'agenda';

export function agendaFactory(
  queueConfig: AgendaConfig,
  rootConfig: AgendaConfig,
) {
  const agendaConfig = {
    ...rootConfig,
    ...queueConfig,
  };

  delete agendaConfig.db;
  delete agendaConfig.mongo;

  return new Agenda(agendaConfig);
}
