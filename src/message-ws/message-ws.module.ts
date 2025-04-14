/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MessageWsService } from './message-ws.service';
import { MessageWsGateway } from './message-ws.gateway';

import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [MessageWsGateway, MessageWsService],
  imports: [AuthModule],
})
export class MessageWsModule {}
