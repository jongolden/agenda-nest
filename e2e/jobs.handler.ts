import { Injectable } from '@nestjs/common';
import {
  Every,
  Schedule,
  Now,
  OnQueueReady,
  OnJobStart,
  OnJobComplete,
  OnJobSuccess,
  OnJobFail,
} from '../lib';

@Injectable()
export class JobsHandler {
  handled: string[] = [];

  @Every('1 second')
  every1Second() {
    this.handled.push(this.every1Second.name);
  }

  @Every({ name: 'test failure', interval: '1 second' })
  testFailure() {
    throw new Error('job failed');
  }

  @Schedule('Tomorrow at noon')
  tomorrowAtNoon() {
    this.handled.push(this.tomorrowAtNoon.name);
  }

  @Now()
  runNow() {
    this.handled.push(this.runNow.name);
  }

  @OnQueueReady()
  onQueueReady() {
    this.handled.push(this.onQueueReady.name);
  }

  @OnJobStart()
  onJobStart() {
    this.handled.push(this.onJobStart.name);
  }

  @OnJobStart('every1Second')
  onTestJobStart() {
    this.handled.push(this.onTestJobStart.name);
  }

  @OnJobComplete('every1Second')
  onTestJobComplete() {
    this.handled.push(this.onTestJobComplete.name);
  }

  @OnJobSuccess('every1Second')
  onTestJobSuccess() {
    this.handled.push(this.onTestJobSuccess.name);
  }

  @OnJobFail('test failure')
  onJobFail(error: Error) {
    this.handled.push(this.onJobFail.name);
  }
}
