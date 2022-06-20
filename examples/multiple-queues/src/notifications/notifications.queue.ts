import Agenda from 'agenda';
import { Every, InjectQueue, OnQueueReady, Queue } from 'agenda-nest';

@Queue('notifications')
export class NotificationsQueue {
  constructor(@InjectQueue('notifications') queue: Agenda) {
    queue.on('complete:sendNotification', () => {
      console.log('notification sent');
    });
  }

  @Every('1 minute')
  sendNotification() {
    console.log('Sending notification to all users');
  }
}
