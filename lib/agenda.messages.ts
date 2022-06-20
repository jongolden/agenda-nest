export const NO_QUEUE_FOUND = (name?: string) =>
  name
    ? `No Agenda queue was found with the given name (${name}). Check your configuration.`
    : 'No Agenda queue was found. Check your configuration.';
