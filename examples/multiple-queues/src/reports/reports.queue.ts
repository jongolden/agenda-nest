import { Every, OnQueueReady, Queue } from 'agenda-nest';

@Queue('reports')
export class ReportsQueue {
  @OnQueueReady()
  onReady() {
    console.log('reports queue is ready');
  }

  @Every('1 minute')
  sendReport() {
    console.log('Sending report to all stakeholders');
  }
}
