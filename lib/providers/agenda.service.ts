import { Injectable } from '@nestjs/common';
import Agenda from 'agenda';

@Injectable()
export class AgendaService extends Agenda {}
