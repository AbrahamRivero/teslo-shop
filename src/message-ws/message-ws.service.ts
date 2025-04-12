/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';

interface ConnectedClients {
  [id: string]: {
    socket: Socket;
    user: User;
  };
}

@Injectable()
export class MessageWsService {
  private connectedClients: ConnectedClients = {};
  registerClient(client: Socket, userId: string) {
    this.connectedClients[client.id] = {
      socket: client,
      user: { id: userId } as User,
    };
  }

  removeClient(clientId: string) {
    delete this.connectedClients[clientId];
  }

  getConnectedClients(): string[] {
    return Object.keys(this.connectedClients);
  }
}
