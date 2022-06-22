export const getQueueToken = (name?: string) =>
  name ? `${name}-queue` : `agenda-queue`;

export const getQueueConfigToken = (name: string): string =>
  `AgendaQueueOptions_${name}`;
