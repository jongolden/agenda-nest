# Agenda Nest

<a href="https://www.npmjs.com/package/agenda-nest" target="_blank"><img src="https://img.shields.io/npm/v/agenda-nest.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/agenda-nest" target="_blank"><img src="https://img.shields.io/npm/l/agenda-nest.svg" alt="Package License" /></a>
</p>

A lightweight job scheduler for NestJS

## Table of Contents
- [Background](#background)
- [Install](#install)
- [Configure Agenda](#configure-agenda)
- [Job processors](#job-processors)
- [Job schedulers](#job-schedulers)
- [Event listeners](#event-listeners)
- [Manually working with a queue](#manually-working-with-a-queue)
- [License](#license)

## Background

Agenda Nest provides a NestJS module wrapper for [Agenda](https://github.com/agenda/agenda), a lightweight job scheduling library.  Heavily inspired by Nest's own Bull implementation, [@nestjs/bull](https://github.com/nestjs/bull), Agenda Nest provides a fully-featured implementation, complete with decorators for defining your jobs, processors and queue event listeners.  You may optionally, make use of Agenda Nest's Express controller to interface with your queues through HTTP.

### Dependencies

Agenda uses MongoDB to persist job data, so you'll need to have Mongo (or mongoose) installed on your system.

## Install

```bash
npm install agenda-nest
```

## Configure Agenda

As Agenda Nest is a wrapper for Agenda, it is configurable with same properties as the Agenda instance. Refer to [AgendaConfig](https://github.com/agenda/agenda/blob/master/lib/agenda/index.ts#L39) for the complete configuration type.

### Synchronously

```ts
import { Module } from '@nestjs/common'
import { AgendaModule } from 'agenda-nest';

@Module({
  imports: [
    AgendaModule.forRoot({
      processEvery: '3 minutes',
      db: {
        addresss: 'mongodb://localhost:27017',
      },
    }),
  ],
  providers: [Jobs],
})
export class AppModule {}
```

### Asynchronously

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgendaModule } from 'agenda-nest';
import configuration from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    AgendaModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        processEvery: config.get('queues.processInterval'),
        db: {
          address: config.get('database.connectionString'),
        },
      }),
      inject: [ConfigService],
    })
  ],
  providers: [Jobs],
})
export class AppModule {}
```

## Configure queues

Agenda Nest can manage multiple queues within your application.  To configure a new queue use `AgendaModule.registerQueue(queueName: string, config: AgendaConfig)`.  Queues will inherit the configuration provided to `Agenda.forRoot`, merging and overriding properties provided to the queue.

### Synchronously

```ts
import { Module } from '@nestjs/common';
import { AgendaModule } from 'agenda-nest';

@Module({
  imports: [
    AgendaModule.registerQueue('notifications', {
      processEvery: '5 minutes',
      autoStart: false, // default: true
      collection: 'notificationsqueue', // default: notifications-queue (`${queueName}-queue`)
    }),
  ],
})
export class NotificationsModule {}
```

### Asynchronously

```js
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgendaModule } from 'agenda-nest';

@Module({
  imports: [
    AgendaModule.registerQueueAsync('notifications', {
      useFactory: (config: ConfigService) => ({
        processEvery: config.get('queues.notifications.processInterval'),
        autoStart: config.get('queues.notifications.autoStart'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class NotificationsModule {}
```

## Job processors

Job processors are methods defined on a class declared with the `@Queue(name: string)` decorator.  The queue name will be used to create the MongoDB collection, formatted as `"{queue Name}-queue"`, for each queue. You can also specify your own collection name.

```js
import { Queue } from 'agenda-nest';

// will use a "notifications-queue" collection
@Queue('notifications')
export class NotificationsQueue {}

// with custom collection name
@Queue('notifications', { collection: 'notificationsqueue' })
export class NotificationsQueue {}
```

To **define**, but not schedule, a job on the queue, use the `@Define()` decorator as shown below.  To define a scheduled job, see [Job schedulers](#job-schedulers).

```js
import { Define, Queue, Job } from 'agenda-nest';

@Queue('notifications')
export class NotificationsQueue {
  @Define()
  sendNotification(job: Job) {}
}
```

## Job schedulers

To define and schedule a job on the queue, use one of the `@Every()`, `@Schedule()`, or `@Now()` decorators. See Agenda's [Creating Jobs](https://github.com/agenda/agenda#creating-jobs) documentation for an explanation on the behavior of each.

### `@Every(nameOrOptions: string | JobOptions)`

Defines a job to run at the given interval

```js
import { Every, Queue, Job } from 'agenda-nest';

@Queue('notifications')
export class NotificationsQueue {
  @Every({ name: 'send notifications', interval: '15 minutes' })
  async sendNotifications(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    sendNotification(users, "Welcome!");
  }
}

@Queue('reports')
export class ReportsQueue {
  @Every('15 minutes')
  async printAnalyticsReport(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    processUserData(users);
  }
}

```

### `@Schedule(nameOrOptions: string | JobOptions)`

Schedules a job to run once at the given time.

```js
import { Schedule, Queue, Job } from 'agenda-nest';

@Queue('notifications')
export class NotificationsQueue {
  @Scheduler({ name: 'send notifications', when: 'tomorrow at noon' })
  async sendNotifications(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    sendNotification(users, "Welcome!");
  }
}

@Queue('reports')
export class ReportsQueue {
  @Schedule('tomorrow at noon')
  async printAnalyticsReport(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    processUserData(users);
  }
}

```

### `@Now(name?: string)`

Schedules a job to run once immediately.

```js
import { Now, Queue, Job } from 'agenda-nest';

@Queue('dance')
export class DanceQueue {
  @Now()
  async doTheHokeyPokey(job: Job) {
    hokeyPokey();
  }

  @Now('do the cha-cha')
  async doTheChaCha(job: Job) {
    chaCha();
  }
}

```

## Event Listeners

Agenda generates a set of useful events when queue and/or job state changes occur. Agenda NestJS provides a set of decorators that allow subscribing to a core set of standard events.

Event listeners must be declared within an injectable class (i.e., within a class decorated with the @Queue() decorator). To listen for an event, use one of the decorators in the table below to declare a handler for the event. For example, to listen to the event emitted when a job enters the active state in the audio queue, use the following construct:

```js
import { OnQueueReady } from 'agenda-nest';
import { Job } from 'agenda-ts';

@Queue()
export class JobsQueue {
  @OnQueueReady()
  onReady() {
    console.log('Jobs queue is ready to run our jobs');
  }
  ...
```

### Agenda Events

An instance of an agenda will emit the queue events listed below. Use the corresponding method decorator to listen for and handle each event.

| Event   | Listener          |                                                                                |
|:--------|:------------------|:-------------------------------------------------------------------------------|
| `ready` | `@OnQueueReady()` | called when Agenda mongo connection is successfully opened and indices created |
| `error` | `@OnQueueError()` | called when Agenda mongo connection process has thrown an error                |

### Job Queue Events

An instance of an agenda will emit the job events listed below. Use the corresponding method decorator to listen for and handle each event.

| Event                             | Listener                        |                                                                   |
|:----------------------------------|:--------------------------------|:------------------------------------------------------------------|
| `start` or `start:job name`       | `@OnJobStart(name?: string)`    | called just before a job starts                                   |
| `complete` or `complete:job name` | `@OnJobComplete(name?: string)` | called when a job finishes, regardless of if it succeeds or fails |
| `success` or `success:job name`   | `@OnJobSuccess(name?: string)`  | called when a job finishes successfully                           |
| `fail` or `fail:job name`         | `@OnJobFail(name?: string)`     | called when a job throws an error                                 |

## Manually working with a queue

You can access any registered queue using the `@InjectQueue(queueName)` decorator, which will inject the instance of `Agenda` for the given queue name. See Agenda's [documentation](https://github.com/agenda/agenda#table-of-contents) for the available API.

```js
@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notificiations') private queue: Agenda) {}

  async scheduleNotification(sendAt: string) {
    await this.queue.schedule('tomorrow at noon', 'sendNotification', {
      to: 'user@example.com',
    });
  }
}
```

## License

Agenda Nest is [MIT licensed](https://github.com/jongolden/agenda-nest/blob/main/LICENSE).
