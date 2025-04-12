/* eslint-disable prettier/prettier */
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageWsService } from './message-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';

@WebSocketGateway({ cors: true })
export class MessageWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  constructor(private readonly messageWsService: MessageWsService) {}

  handleConnection(client: Socket) {
    this.messageWsService.registerClient(client, client.id);
    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnectedClients(),
    );
  }

  handleDisconnect(client: Socket) {
    this.messageWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnectedClients(),
    );
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    //!Emite un mensaje al cliente
    /*     client.emit('message-from-server', {
      fullName: 'Yo',
      message: payload.message,
    }); */
    //!Emite un mensaje a todos los clientes excepto al que lo envio
    /*     client.broadcast.emit('message-from-server', {
      fullName: 'Yo',
      message: payload.message,
    }); */

    //!Emite un mensaje a todos los clientes
    this.wss.emit('message-from-server', {
      fullName: 'Yo',
      message: payload.message,
    });
  }
}
