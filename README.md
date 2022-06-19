# Agenda Nest
> A NestJS module for Agenda

## Table of Contents
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Configuring an agenda](#configuring-an-agenda)
  - [Job processors](#job-processors)
  - [Job schedulers](#job-schedulers)
  - [Start/stop the job processor]()
  - [Event listeners](#event-listeners)
  - [Manually working with the queue](#manually-working-with-the-queue)
- [Contributing](#contributing)
- [License](#license)

## Background

Agenda Nest provides a NestJS module wrapper for [Agenda](https://github.com/agenda/agenda), a light-weight job scheduling library.  Heavily inspired by Nest's own Bull implementation, [@nestjs/bull](https://github.com/nestjs/bull), Agenda Nest provides a fully-featured implementation, complete with decorators for defining your jobs, processors and queue event listeners.  You may optionally, make use of Agenda Nest's Express controller to interface with your queues through HTTP.

### Dependencies

Agenda uses MongoDB to persist job data, so you'll need to have Mongo (or mongoose) installed on your system.

## Install

```bash
npm install agenda-nest
```

## Usage

## Configuring an Agenda

```js
@Module({
  imports: [
    AgendaModule.register({
      db: {
        addresss: 'mongodb://localhost:27017',
        collection: 'job-queue',
      },
    }),
  ],
  providers: [Jobs],
})
export class AppModule {}
```

## Job Processors

Job processors are defined using the the `@Define` decorator.  Refer to Agenda's documentation on job definition options.

#### Example
```js
@Injectable()
export class Jobs {
  @Define('say hello')
  sayHello(job: Job) {
    this.logger.log(`Hello  ${job.attrs.userName}!`)
  }

  @Define('some long running job')
  async handleSomeLengthyTask(job: Job) {
    const data = await doSomeLengthyTask();

    await formatThatData(data);
    await sendThatData(data);
  }
}

```

## Job Schedulers

### `@Every(nameOrOptions: string | JobOptions)`

Defines a job to run at the given interval

#### Example
```js
@Injectable()
export class Jobs {
  @Every('15 minutes')
  async printAnalyticsReport(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    processUserData(users);
  }

  @Every({ name: 'send notifications', interval: '15 minutes' })
  async sendNotifications(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    sendNotification(users, "Welcome!");
  }
}

```

### `@Schedule(nameOrOptions: string | JobOptions)`

Schedules a job to run once at the given time.

#### Example
```js
@Injectable()
export class Jobs {
  @Schedule('tomorrow at noon')
  async printAnalyticsReport(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    processUserData(users);
  }

  @Scheduler({ name: 'send notifications', when: 'tomorrow at noon' })
  async sendNotifications(job: Job) {
    const users = await User.doSomethingReallyIntensive();
    sendNotification(users, "Welcome!");
  }
}

```

### `@Now(name?: string)`

Schedules a job to run once immediately.

#### Example
```js
@Injectable()
export class Jobs {
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

## Start/Stop the Job Processor

lorem ispum

## Event Listeners

Agenda generates a set of useful events when queue and/or job state changes occur. Agenda NestJS provides a set of decorators that allow subscribing to a core set of standard events.

Event listeners must be declared within an injectable class (i.e., within a class decorated with the @Queue() decorator). To listen for an event, use one of the decorators in the table below to declare a handler for the event. For example, to listen to the event emitted when a job enters the active state in the audio queue, use the following construct:

```js
import { OnQueueReady } from 'agenda-nest';
import { Job } from 'agenda';

@Queue()
export class JobsQueue {
  @OnQueueReady()
  onReady() {
    console.log('Jobs queue is ready to run our jobs');
  }
  ...
```

### Agenda Events

An instance of an agenda will emit the following events:

| Event listener | Handler method signature / When fired |
|---|---|
| `@OnQueueReady()` | called when Agenda mongo connection is successfully opened and indices created |
| `@OnQueueError()` | called when Agenda mongo connection process has thrown an error |

### Job Queue Events

An instance of an agenda will emit the following events:

| Event listener | Handler method signature / When fired |
|----------------|---------------------------------------|
| `@OnJobStart(name?: string)` | called just before a job starts |
| `@OnJobComplete(name?: string)` | called when a job finishes, regardless of if it succeeds or fails |
| `@OnJobSuccess(name?: string)` | called when a job finishes successfully |
| `@OnJobFail(name?: string)` | called when a job throws an error |
