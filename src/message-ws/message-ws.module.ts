/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MessageWsService } from './message-ws.service';
import { MessageWsGateway } from './message-ws.gateway';

@Module({
  providers: [MessageWsGateway, MessageWsService],
})
export class MessageWsModule {}
