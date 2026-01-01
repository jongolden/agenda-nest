import { Every, OnJobComplete, Queue } from 'agenda-nest';

@Queue('notifications')
export class NotificationsQueue {
  @Every('1 minute')
  sendNotification() {
    console.log('Sending notification to all users');
  }

  @OnJobComplete('sendNotification')
  onNotificationSent() {
    console.log('notification sent');
  }
}
