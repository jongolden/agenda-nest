export const getQueueToken = (name?: string) =>
  name ? `${name}-queue` : `agenda-queue`;

export const getQueueOptionsToken = (name?: string): string =>
  name ? `AgendaQueueOptions_${name}` : 'AgendaQueueOptions_default';
