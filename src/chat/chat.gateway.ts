import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards } from '@nestjs/common';

import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { SOCKET_EVENT } from './utils/enum';
import { ChatDto } from './dto/chat.dto';

@WebSocketGateway(3003, { cors: { origin: '*', allowedHeaders: ['token'] } })
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  /** Connect User */
  async handleConnection(@ConnectedSocket() socket: Socket) {
    await this.chatService.connect_socket(socket);
  }

  /** Disconnect User */
  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    await this.chatService.disconnect_socket(socket);
  }

  /** Send Message */
  @SubscribeMessage(SOCKET_EVENT.SEND_MESSAGE)
  message(@MessageBody() data: ChatDto, @ConnectedSocket() socket: Socket) {
    return this.chatService.sendMessage(this.server, socket, data);
  }

  /**
   * When User Joins the Room
   * The Room will be created automatically
   */
  @SubscribeMessage(SOCKET_EVENT.CREATE_ROOM)
  async createRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: string,
  ) {
    await this.chatService.createRoom(socket, room);
  }

  @SubscribeMessage(SOCKET_EVENT.JOIN_ROOM)
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: string,
  ) {
    await this.chatService.joinRoom(socket, room);
  }

  @SubscribeMessage(SOCKET_EVENT.LEAVE_ROOM)
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: string,
  ) {
    await this.chatService.leaveRoom(socket, room);
  }
}
