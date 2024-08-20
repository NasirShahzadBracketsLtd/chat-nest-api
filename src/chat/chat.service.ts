import { DoctorsService } from 'src/doctors/doctors.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Chat } from './entities/chat.entity';
import { AuthHelper } from 'src/auth/utils/auth-helper';
import { ROLE_ENUM } from 'src/doctors/utility/enum';
import { PatientsService } from 'src/patients/patients.service';
import { createClient } from 'redis';
import { SOCKET_EVENT } from './utils/enum';

@Injectable()
export class ChatService {
  private redisClient = createClient({ url: 'redis://localhost:6379' });

  private logger = new Logger(this.redisClient.constructor.name);

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,

    private readonly authHelper: AuthHelper,

    private readonly doctorsService: DoctorsService,

    private readonly patientService: PatientsService,
  ) {
    /** ------------------ Local-Redis Connection ------------------ */
    this.redisClient
      .connect()
      .then(() => console.log(`Successfully Connected to Local-Redis`))
      .catch((err) =>
        console.error(`------------Error Connecting to Redis------------`, err),
      );
  }

  /** Redis Methods (we'll use these methods in RedisService later)  */
  async addUserSocket(userId: string, socketId: string): Promise<void> {
    await this.redisClient.set(`userSocket:${userId}`, socketId);
  }

  async getSocketId(userId: string): Promise<string | null> {
    return await this.redisClient.get(`userSocket:${userId}`);
  }

  async removeSocketId(userId: string): Promise<void> {
    await this.redisClient.del(`userSocket:${userId}`);
  }

  async getAllSocketIds(): Promise<string[]> {
    const keys = await this.redisClient.keys('userSocket:*');

    if (keys.length > 0) {
      const socketIds = await this.redisClient.mGet(keys);
      return socketIds.filter((id: string) => id !== null) as string[];
    }
    return [];
  }

  async removeAllSocketIds(): Promise<void> {
    const keys = await this.redisClient.keys('userSocket:*');
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  /**  Handling Connection/Disconnection  */

  /**
   * Used Manual Authentication for Connection Establishment
   * If there is any error during connection, then the user will be disconnected and an error message will be displayed.
   * Update isOnline status = true in db
   * Add Socket ID in Redis when user is Connected
   */
  async connect_socket(socket: Socket): Promise<any> {
    try {
      const token: string = await this.authHelper.client_headers(socket);

      const user = await this.authHelper.decode_token_and_verify_user(token);

      /** Set isOnline = true */
      user?.role === ROLE_ENUM.DOCTOR
        ? await this.doctorsService.setOnline(user?._id, token)
        : await this.patientService.setOnline(user?._id, token);

      socket[`user`] = user;

      /** Add Socket_Id after every connection */
      await this.addUserSocket(user?._id.toString(), socket.id);

      console.log(
        `Stored-----------> socket_id: "${socket.id}" for user-Id: "${user?._id.toString()}" in Local-Redis`,
      );

      console.log(`Web-Socket Connection Successful...`);
    } catch (error) {
      console.error(`Error during WebSocket connection:`, error.message);
      socket.emit(`error`, error.message);
      socket.disconnect();
    }
  }

  /**
   * Used Manual Authentication for Disconnection Establishment
   * If there is any error during connection, then the user will be disconnected and an error message will be displayed.
   * Update isOnline status = false in db
   * Remove Socket_Id from Redis when a user Disconnects
   */
  async disconnect_socket(socket: Socket): Promise<any> {
    try {
      const token: string = await this.authHelper.client_headers(socket);

      const user = await this.authHelper.decode_token_and_verify_user(token);

      /** Set isOnline = false */
      user?.role === ROLE_ENUM.DOCTOR
        ? await this.doctorsService.setOffline(user?._id)
        : await this.patientService.setOffline(user?._id);

      socket[`user`] = user;

      /** Remove Socket_Id from Redis when a user Disconnects */
      await this.removeSocketId(user?._id.toString());
      console.log(
        `Removed-----------> socket_id: "${socket.id}" for user-Id: "${user?._id.toString()}" from Local-Redis`,
      );

      console.log(`Web-Socket Disconnected`);
    } catch (error) {
      console.error(`Error during WebSocket connection:`, error.message);
      socket.emit(`error`, error.message);
      socket.disconnect();
    }
  }

  /**  Handling Messages  */
  async sendMessage(server: Server, socket: Socket, data: any): Promise<any> {
    try {
      const { _receiver_id } = data;

      /** Get SocketId from Redis from given Receiver_Id */
      const getReceiverSocketIdFromRedis = await this.getSocketId(
        _receiver_id.toString(),
      );

      /**
       * Get Sender_Id from Socket.User (from given Token)
       * Receiver_Id given from Client
       */
      data._sender_id = socket[`user`][`_id`];
      data._receiver_id = new Types.ObjectId(_receiver_id);

      /** Validate User's Existence here... */

      /** Save chat in db */
      let create = new this.chatModel(data);
      const created = await create.save();
      return created;
    } catch (error) {
      console.log(error);
    }
  }

  /**  Handling Rooms Methods  */
  async createRoom(socket: Socket, room: string): Promise<void> {
    await socket.join(room);
    socket.to(room).emit(SOCKET_EVENT.CREATE_ROOM, {
      message: `User Joined: ${socket.id}`,
    });
  }

  async joinRoom(socket: Socket, room: string): Promise<void> {
    await socket.join(room);
    socket.to(room).emit(SOCKET_EVENT.JOIN_ROOM, {
      message: `User Joined: ${socket.id}`,
    });
  }

  async leaveRoom(socket: Socket, room: string): Promise<void> {
    await socket.leave(room);
    socket.to(room).emit(SOCKET_EVENT.LEAVE_ROOM, {
      message: `User Left: ${socket.id}`,
    });
  }
}

/**------------------------------------------------------------------
              * Store data in Memory Map (without Redis)
 ------------------------------------------------------------------*/
//  private userSocketMap = new Map<string, string>(); // Stores userId -> socket_Ids

//  addUserSocket(userId: string, socketId: string): void {
//    this.userSocketMap.set(userId, socketId);
//  }

//  getSocketId(userId: string): string | undefined {
//    return this.userSocketMap.get(userId);
//  }

//  removeUserSocket(userId: string): void {
//    this.userSocketMap.delete(userId);
//  }

//  getAllSocketIds(): string[] {
//    return Array.from(this.userSocketMap.values());
//  }
