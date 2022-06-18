# Agenda NestJS
> A NestJS module for Agenda

## Table of Contents
- [Install](#install)
- [Configuring an Agenda](#configuring-an-agenda)
- [Job Processors](#job-processors)
- [Job Schedulers](#job-schedulers)
- [Start/Stop the job processor]()
- [Event Listeners](#event-listeners)

## Install

```bash
npm install agenda-nestjs
```

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
