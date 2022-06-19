import { Injectable, Logger } from '@nestjs/common';
import { Every, OnJobComplete, OnJobStart, OnQueueError, OnQueueReady } from 'agenda-nest';

@Injectable()
export class Tasks {
  private readonly logger = new Logger(Tasks.name);

  @OnQueueReady()
  onQueueReady() {
    this.logger.log('Agenda queue ready');
  }

  @OnQueueError()
  onQueueError(error) {
    this.logger.log('Agenda queue error', error);
  }

  @OnJobStart()
  onJobStart() {
    this.logger.log('Agenda job starting');
  }

  @OnJobComplete()
  onJobComplete() {
    this.logger.log('Agenda job complete');
  }

  @OnJobStart('log')
  onLogStart() {
    this.logger.log('log job started');
  }

  @Every('10 seconds')
  log() {
    this.logger.log('running job');
  }

  @Every({
    name: 'example job',
    interval: '10 seconds',
  })
  exampleJob() {
    this.logger.log('running example');
  }

}
