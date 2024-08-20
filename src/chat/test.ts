// import {
//   BeforeApplicationShutdown,
//   Inject,
//   Injectable,
//   Logger,
//   OnModuleInit,
//   UseFilters,
//   UsePipes,
//   ValidationPipe,
// } from '@nestjs/common';
// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
//   WsException,
// } from '@nestjs/websockets';
// import { Not, Equal, DataSource } from 'typeorm';
// import { RedisClientType } from 'redis';
// import { Server, Socket } from 'socket.io';
// import {
//   CreateCustomizeTourDTO,
//   CustomizedTourCancelDTO,
//   CustomizedTourEndDTO,
// } from '@app/common';
// import { SendCustomizedTourStartEvent } from '../dtos/chat.dto';
// import {
//   NotiTypeEnum,
//   TouristNotification,
// } from '../notifications/entities/tourist.notification.entity';
// import { InjectDataSource } from '@nestjs/typeorm';
// import {
//   CustomizedTourJoinee,
//   JoineeStatus,
// } from 'apps/apigateway/src/customized-tour_joinees/entities/customized-tour_joinee.entity';
// import {
//   CustomizedTour,
//   CustomizedTourStatus,
// } from 'apps/apigateway/src/customized_tour/entities/c_t.entity';
// import { CancelByEnum } from 'apps/apigateway/src/quick-tours/entities/quick-tour.entity';
// import { Direction, GroupChat } from '../entities/group-chat.entity';
// import { User, UserRole } from '@app/common/auth/entities/user.entity';
// import {
//   ExitScreenDTO,
//   LeaveCustRoomDTO,
//   TouristJoinedDTO,
// } from './dtos/tourist-joined.dto';
// import { WebsocketExceptionsFilter } from './dtos/ws-exception-filter';
// import {
//   PubTouristDTO,
//   PublicTouristReqDTO,
// } from './dtos/public-tourist-req.dto';
// import { Tourist } from 'apps/apigateway/src/tourist/entities/tourist.entity';
// import { error } from 'console';
// import { TourGuide } from 'apps/apigateway/src/tourguide/entities/tour-guide.entity';
// import { NotificationToken } from '../../../notifications/src/entities/notification_token.entity';
// import * as firebase from 'firebase-admin';
// import * as dotenv from 'dotenv';
// import {
//   NotificationDirection,
//   PushNotification,
// } from 'apps/notifications/src/entities/push_notification.entity';
// import { PushNotificationMapper } from 'apps/notifications/src/tourist_to_guide_notif/mappers/notification.mapper';
// dotenv.config();
// @WebSocketGateway(3001, {
//   // namespace: 'customized_tour',

//   cors: {
//     origin:
//       process.env.NODE_ENV === 'development'
//         ? '*'
//         : [
//             'http://localhost:3000',
//             'http://localhost:3001',
//             'https://tour27-tourist-web-app.vercel.app',
//             'https://www.dev.app.tour27.bracketsltd.com',
//             'https://dev.app.tour27.bracketsltd.com',
//             'https://dev.customize-tour.tour27.bracketsltd.com',
//             'https://www.dev.customize-tour.tour27.bracketsltd.com',
//             'https://tour27.com',
//             'https://www.tour27.com',
//             'https://www.chat.tour27.com',
//             'https://chat.tour27.com',
//             'https://api.tour27.com',
//             'https://www.api.tour27.com',
//             'https://customize-tour.tour27.com',
//             'https://www.customize-tour.tour27.com',
//             'https://demo.api.tour27.com',
//             'https://www.demo.api.tour27.com',
//             'https://demo.customize-tour.tour27.com',
//             'https://www.demo.customize-tour.tour27.com',
//             'https://www.demo.chat.tour27.com',
//             'https://demo.chat.tour27.com',
//           ],
//     allowedHeaders: ['Authorization'],
//   },
// })
// @Injectable()
// @UseFilters(WebsocketExceptionsFilter)
// @UsePipes(new ValidationPipe({ transform: true }))
// export class CustomizedTourGateway
//   implements OnModuleInit, BeforeApplicationShutdown, OnGatewayDisconnect
// {
//   private readonly logger: Logger = new Logger(CustomizedTourGateway.name);

//   constructor(
//     @Inject(process.env.REDIS_TOKEN)
//     private readonly redis_client: RedisClientType,

//     @InjectDataSource()
//     private readonly data_source: DataSource,
//   ) {}

//   @WebSocketServer()
//   server: Server;

//   onModuleInit() {
//     this.server.on('connection', async (socket) => {
//       try {
//         this.logger.log(`Socket Connection Event in Customized Tour Gateway`);
//         // Authorization Header contains the phone number.
//         // ! there is a security risk later On need to encrypt the users phone number,
//         //! than allow the connection.
//         const id = socket.handshake.auth.token;
//         this.logger.debug(`user with id ${id} tries to connect with socket`);

//         const old_socket_exist = await this.redis_client.get(
//           `message_receiver:${id}`,
//         );

//         if (old_socket_exist) {
//           const user = await this.redis_client.hGetAll(
//             `message_sender:${old_socket_exist}`,
//           );

//           if (user.role === 'tour_guide') {
//             // deleting old creds
//             await this.redis_client.del(`message_receiver:${id}`);
//           } else if (user.role === 'tourist') {
//             const is_registered_user = await this.data_source
//               .getRepository(User)
//               .findOneBy({ id });
//             if (!is_registered_user) {
//               socket.emit('already_joined', { id });
//               socket.disconnect(true);
//               return;
//             } else {
//               await this.redis_client.del(`message_receiver:${id}`);
//             }
//           }
//         }

//         this.logger.debug(
//           (await this.server.fetchSockets()).length,
//           'count of sockets',
//         );
//         // Need to check if this phone number already connected socket.
//         // const conn_socket_found = await this.redis_client.get(
//         //   `message_receiver:${phone_number}`,
//         // );
//         // all serializable datastructures are supported (no need to call JSON.stringify)
//         // socket.emit("hello", 1, "2", { 3: ["4"], 5: Buffer.from([6]) });

//         // if (conn_socket_found) {
//         //   socket.emit('NOT_ALLOWED');
//         //   await this.handleDisconnect(socket);
//         //   return;
//         // }
//         const guide_found = await this.data_source.getRepository(User).exist({
//           where: {
//             id: id,
//             role: 'tour_guide',
//           },
//         });

//         await this.redis_client.hSet(`message_sender:${socket.id}`, {
//           profile_id: id,
//           role: guide_found ? 'tour_guide' : 'tourist',
//         });

//         const is_socket_saved = await this.redis_client.set(
//           `message_receiver:${id}`,
//           socket.id,
//         ); // will get OK when socket id saved.
//         this.logger.debug(is_socket_saved, 'socket saved in redis');
//       } catch (err) {
//         this.logger.log(JSON.stringify(err));
//         socket.emit('BAD_REQUEST', { message: err.message });
//         socket.disconnect();
//         return;
//       }
//     });
//   }

//   async handleDisconnect(socket) {
//     const user = await this.redis_client.hGetAll(`message_sender:${socket.id}`);
//     Object.keys(user).forEach(async (field) => {
//       await this.redis_client.hDel(`message_sender:${socket.id}`, field);
//     });

//     await this.redis_client.del(`message_receiver:${user.profile_id}`);

//     const rooms_arr: string[] = Array.from(socket.adapter.rooms.keys());

//     this.logger.debug(rooms_arr, 'socket was joined in these rooms');

//     this.server.to(rooms_arr).emit('user_leave', {
//       socket_id: socket.id,
//       profile_id: user.profile_id,
//     });

//     const joinee = await this.data_source
//       .getRepository(CustomizedTourJoinee)
//       .findOne({
//         where: {
//           id: user.profile_id,
//         },
//       });

//     if (joinee && joinee.status === JoineeStatus.ACTIVE) {
//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .update(joinee.id, {
//           status: JoineeStatus.PENDING,
//         });
//     }

//     rooms_arr.forEach((room_id: string) => socket.leave(room_id));

//     return;
//   }

//   async cleanup() {
//     // const socketIds = Array.from(this.server.sockets.sockets.keys());
//     const socket_ids = [];
//     const fetchSockets = await this.server.fetchSockets();
//     fetchSockets.forEach((socket) => {
//       socket_ids.push(socket.id);
//     });
//     this.logger.debug('cleaning these sockets', socket_ids);
//     // Loop over each socket ID to delete Redis credentials
//     for (const socketId of socket_ids) {
//       const user = await this.redis_client.hGetAll(
//         `message_sender:${socketId}`,
//       );

//       // Loop over each field in the user object to delete
//       for (const field of Object.keys(user)) {
//         await this.redis_client.hDel(`message_sender:${socketId}`, field);
//       }

//       await this.redis_client.del(`message_receiver:${user.profile_id}`);
//     }
//   }

//   beforeApplicationShutdown(_signal?: string) {
//     this.logger.debug(`Application shutting down due to ${_signal}`);
//     this.cleanup();
//   }

//   async afterInit() {}
//   // this event is being fired up when tourist joined the server.
//   async join_room(socket_id: string, room: string, tour_guide_id?: string) {
//     try {
//       const socket = await this.server.fetchSockets();

//       const needed_socket: any = socket.find((s) => s.id === socket_id);

//       if (!needed_socket) {
//         this.logger.error('Needed socket not found');
//         needed_socket.emit('BAD_REQUEST', { message: 'Socket Not Connected' });
//         throw new WsException('No socket instance found');
//       }

//       const room_found = needed_socket.adapter.rooms.get(room);

//       if (!room_found) {
//         this.logger.error(
//           "Tourist can't join the room because the guide has not started the tour",
//         );
//         needed_socket.emit('BAD_REQUEST', {
//           message: 'The room name is invalid or the tour has not started',
//         });
//       } else {
//         needed_socket.join(room);

//         if (tour_guide_id) {
//           this.logger.debug('Going to create the room');
//           this.server.to(room).emit('cust_tour_room_created', {
//             tour_guide_id,
//             socket_id,
//           });
//         }
//       }
//     } catch (error) {
//       this.server
//         .to(socket_id)
//         .emit('BAD_REQUEST', { message: 'Socket could not join the room' });
//     }
//   }

//   @SubscribeMessage('mic_or_cam_switch')
//   mic_or_cam_switch_by_guide(
//     @MessageBody() data: string,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const socket_ids_tourists = [];

//       const parsed_data = JSON.parse(data);

//       /* parsed data will have structure like this:

//         {
//           tourist_ids:["------>tourist_id<------"],
//           event_type: EventEnum,

//           EventEnum {
//             mic_enable,
//             mic_disable,
//             cam_enable,
//             cam_disable
//           }
//         }

//         */
//       this.logger.debug('mic_or_cam_switch  event');

//       parsed_data.tourist_ids.forEach(async (tourist_id: string) => {
//         const socket_id = await this.redis_client.get(
//           `message_receiver:${tourist_id}`,
//         );

//         socket_ids_tourists.push(socket_id);
//       });

//       this.server
//         .to(socket_ids_tourists)
//         .emit('mic_or_cam_switch_from_guide', parsed_data.event_type);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//     }
//   }

//   // this event will be fired by tourist and guide will receive it.
//   @SubscribeMessage('cust_tour_mic_req_tourist')
//   cust_tour_mic_req_tourist(
//     @ConnectedSocket() socket: Socket,
//     @MessageBody() data: string,
//   ) {
//     try {
//       const parsed_data = JSON.parse(data);
//       // const socket_id = await this.redis_client.get(
//       //   `message_receiver:${parsed_data.quick_tour_id}`,
//       // );
//       this.logger.debug('cust_tour_mic_req_tourist');
//       this.server
//         .to(parsed_data.customized_tour_id)
//         .emit('allow_tourist_mic_cust_tour', parsed_data);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//     }
//   }
//   // this event will be fired by guide and tourist will listen it.
//   @SubscribeMessage('accept_tourist_mic_req_cust_tour')
//   async accept_tourist_mic_req_cust_tour(
//     @MessageBody() data,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const parsed_data = JSON.parse(data);
//       const socket_id = await this.redis_client.get(
//         `message_receiver:${parsed_data.tourist_id}`,
//       );

//       this.logger.debug('accept_tourist_mic_req_cust_tour');

//       this.server
//         .to(socket_id)
//         .emit('accepted_tourist_mic_allow_req', parsed_data);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//     }
//   }
//   // this event will be fired by guide and tourist will listen it.
//   @SubscribeMessage('reject_tourist_mic_req_cust_tour')
//   async reject_tourist_mic_req_customized_tour(
//     @MessageBody() data,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const parsed_data = JSON.parse(data);
//       const socket_id = await this.redis_client.get(
//         `message_receiver:${parsed_data.tourist_id}`,
//       );

//       this.logger.debug('reject_tourist_mic_req_cust_tour');
//       this.server
//         .to(socket_id)
//         .emit('rejected_tourist_mic_allow_req', parsed_data);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//     }
//   }
//   //this event will be fired by tourist and listen by guide.When tourist request the mic but in next instant cancel his request.
//   @SubscribeMessage('cancel_on_the_way_mic_req_cust_tour')
//   cancel_mic_req_cust_tour(
//     @MessageBody() data,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const parsed_data = JSON.parse(data);
//       this.logger.debug('cancel_on_the_way_mic_req_cust_tour');
//       this.server
//         .to(parsed_data.customized_tour_id)
//         .emit('canceled_mic_of_tourist_customized_tour', parsed_data);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//     }
//   }
//   // this event will be trigger by public_tourist and listen by master tourist.
//   @SubscribeMessage('public_tourist_join_req')
//   async public_tourist_send_join_request(
//     @MessageBody() data: PublicTouristReqDTO,
//     @ConnectedSocket() socket: Socket,
//   ): Promise<void> {
//     try {
//       this.logger.debug(
//         'public_tourist send the join request',
//         JSON.stringify(data),
//       );
//       // getting master tourist from the database.
//       const { tourist_id }: { tourist_id: string } = await this.data_source
//         .getRepository(CustomizedTour)
//         .createQueryBuilder('c_t')
//         .leftJoin('c_t.tourist', 'tourist')
//         .leftJoin('tourist.user', 'user')
//         .select(['user.id as tourist_id'])
//         .where('c_t.id = :id', { id: data.customized_tour_id })
//         .getRawOne();

//       console.log(tourist_id, 'tourist_id public_tourist_send_join_request');

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${tourist_id}`,
//       );

//       console.log(socket_id, 'socket_id public_tourist_send_join_request');

//       const cust_tour_joinee = await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .findOne({
//           where: {
//             id: data.id,
//             status: Not(Equal(JoineeStatus.CANCELED)),
//           },
//         });
//       console.log(
//         cust_tour_joinee,
//         'cust_tour_joinee public_tourist_send_join_request',
//       );
//       if (!cust_tour_joinee) {
//         socket.emit('INTERNAL_SERVER_ERROR', {
//           error: `Customized tour joinee Not found`,
//         });

//         return;
//       }
//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .update(cust_tour_joinee.id, {
//           status: JoineeStatus.WAITING,
//         });

//       this.server.to(socket_id).emit('public_tourist_req', {
//         id: data.id,
//         name: data.name,
//         customized_tour_id: data.customized_tour_id,
//       });

//       console.log('public_tourist_req public_tourist_send_join_request');
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR');
//       this.logger.error(error);
//     }
//   }
//   // this event will be triggered when master tourist allow public tourist in the room and its response event will be listen by
//   // public tourist and guide.
//   @SubscribeMessage('add_pub_tourist_in_tour')
//   async add_public_tourist_in_call(
//     @MessageBody() data: PubTouristDTO,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const { public_tourist_id, customized_tour_id } = data;
//       // const parsed_data = JSON.parse(data);
//       // data:{master_tourist_id: string, public_tourist_id: string, public_tourist_name: string}
//       // Also first check the joinee is waiting for master tourist response to join req.
//       this.logger.debug('add_pub_tourist_in_tour', JSON.stringify(data));

//       const joinee = await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .findOne({
//           where: {
//             id: public_tourist_id,
//             status: JoineeStatus.WAITING,
//             customized_tour_id,
//           },
//         });
//       console.log(joinee, 'joinee add_public_tourist_in_call');

//       if (!joinee) {
//         socket.emit('BAD_REQUEST', {
//           message: 'problem in joining tourist occured',
//         });
//         return;
//       }
//       // need to change the status of joinnee.

//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .update(joinee.id, {
//           status: JoineeStatus.ACTIVE,
//         });

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${public_tourist_id}`,
//       );

//       this.logger.log(`this public tourist added in tour ${public_tourist_id}`);

//       this.server.to(socket_id).emit('added_in_tour', joinee);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR');
//       this.logger.error(error);
//       return;
//     }
//   }
//   // this event will be triggered by guide and will be listen by public tourist.
//   @SubscribeMessage('deny_pub_tourist')
//   async deny_public_tourist(
//     @MessageBody() data: PubTouristDTO,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       this.logger.debug('master_tourist deny the join request.');

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${data.public_tourist_id}`,
//       );
//       const cust_tour_joinee = await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .findOne({
//           where: {
//             id: data.public_tourist_id,
//           },
//         });
//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .update(cust_tour_joinee.id, {
//           status: JoineeStatus.PENDING,
//         });

//       this.server.to(socket_id).emit('req_denied');
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR');
//       this.logger.error(error);
//     }
//   }
//   // this event will be triggered when master tourist allow public tourist in the room and its response event will be listen by
//   // public tourist and guide.
//   @SubscribeMessage('remove_pub_tourist_from_tour')
//   async remove_public_tourist_in_call(
//     @MessageBody() data: PubTouristDTO,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       this.logger.debug('remove_pub_tourist_from_tour');
//       // data:{master_tourist_id: string, public_tourist_id: string}
//       // Also first check the joinee is waiting for master tourist response to join req.
//       const { public_tourist_id } = data;
//       const joinee = await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .findOne({
//           where: {
//             id: public_tourist_id,
//             status: JoineeStatus.ACTIVE,
//           },
//         });

//       if (!joinee) {
//         socket.emit('BAD_REQUEST', {
//           message:
//             'problem in removing public tourist from the tour has occured',
//         });
//         return;
//       }
//       // need to change the status of joinnee.

//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .update(joinee.id, {
//           status: JoineeStatus.INACTIVE,
//         });

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${public_tourist_id}`,
//       );
//       this.server
//         .to([socket_id, joinee.customized_tour_id])
//         .emit('removed_from_tour', {
//           public_tourist_id: public_tourist_id,
//           public_tourist_name: joinee.name,
//         });
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR');
//       this.logger.error(error);
//       return;
//     }
//   }

//   @SubscribeMessage('delete_pub_tourist_from_tour')
//   async delete_public_tourist_in_call(
//     @MessageBody() data: PubTouristDTO,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       // data:{master_tourist_id: string, public_tourist_id: string}

//       // Only allow active tourist to be permanently removed from the tour.
//       const { public_tourist_id } = data;
//       const joinee = await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .findOne({
//           where: {
//             id: public_tourist_id,
//             status: JoineeStatus.ACTIVE,
//           },
//         });

//       if (!joinee) {
//         socket.emit('BAD_REQUEST', {
//           message: 'problem in banning tourist occured as joinee not found',
//         });
//         return;
//       }
//       // need to change the status of joinnee.

//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .update(joinee.id, {
//           status: JoineeStatus.CANCELED,
//         });

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${public_tourist_id}`,
//       );

//       this.server
//         .to([socket_id, joinee.customized_tour_id])
//         .emit('deleted_from_tour', {
//           public_tourist_id,
//           public_tourist_name: joinee.name,
//         });

//       // need to send message
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR');
//       this.logger.error(error);
//     }
//   }
//   // This event
//   @SubscribeMessage('mute_all')
//   mute_all(@MessageBody() data: string, @ConnectedSocket() socket: Socket) {
//     try {
//       const socket_ids_tourists = [];
//       const parsed_data = JSON.parse(data);
//       parsed_data.tourist_ids.forEach(async (tourist_id: string) => {
//         const socket_id = await this.redis_client.get(
//           `message_receiver:${tourist_id}`,
//         );
//         socket_ids_tourists.push(socket_id);
//       });
//       this.server
//         .to(socket_ids_tourists)
//         .emit('mute_all_req', 'Mute all the tourists');
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//       this.logger.error(error);
//       return;
//     }
//   }
//   // When guide want to mute some tourist he has to hit this event.
//   @SubscribeMessage('mute_tourist_req')
//   async mute_tourist(
//     @MessageBody() tourist: string,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const _tourist = JSON.parse(tourist);
//       const tourist_socket_id = await this.redis_client.get(
//         `message_receiver:${_tourist.tourist_id}`,
//       );
//       this.server
//         .to(tourist_socket_id)
//         .emit('mute_tourist_res', 'your tour guide has muted you');
//     } catch (err) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: err.message });
//     }
//   }
//   // This event will be triggered when tourist mute his mic.and Guide has to listan on this event.
//   @SubscribeMessage('mic_muted')
//   async mic_muted_by_tourist(
//     @ConnectedSocket() socket: Socket,
//     @MessageBody() data: string,
//   ) {
//     try {
//       const _parsed_data = JSON.parse(data);
//       const guide_socket_id = await this.redis_client.get(
//         `message_receiver:${_parsed_data.tour_guide_id}`,
//       );
//       this.logger.debug('mic_muted');

//       this.server
//         .to(guide_socket_id)
//         .emit('mic_muted_by_tourist', _parsed_data);
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//       return;
//     }
//   }
//   // send the event that guide has enable the mic. NOw all tourist allowed to make request here.
//   @SubscribeMessage('enable_all_mic')
//   enable_tourist_to_talk(
//     @MessageBody() data: string,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const tourist_socket_ids: string[] = [];

//       const _parsed_data = JSON.parse(data);

//       _parsed_data.tourist_ids.forEach(async (tourist_id: string) => {
//         const socket_id = await this.redis_client.get(
//           `message_receiver:${tourist_id}`,
//         );
//         tourist_socket_ids.push(socket_id);
//       });
//       this.server
//         .to(tourist_socket_ids)
//         .emit('mic_enabled', 'Guide has enabled the mic');
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//       this.logger.error(error);
//     }
//   }

//   @SubscribeMessage('cust_tour_on_hold')
//   async cust_tour_on_hold(
//     @MessageBody() data: string,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       this.logger.log(data, `going to send cust tour on hold soon`);
//       const p_data = JSON.parse(data);

//       if (!p_data.customized_tour_id) {
//         socket.emit('BAD_REQUEST', {
//           message: 'customized tour id not found in data',
//         });
//         return;
//       }

//       const customized_tour = await this.data_source
//         .getRepository(CustomizedTour)
//         .createQueryBuilder('c_t')
//         .leftJoin('c_t.tourist', 'tourist')
//         .leftJoin('tourist.user', 'user')
//         .leftJoin('c_t.tour_guide', 'guide')
//         .select([
//           'c_t.id as id',
//           'c_t.status as status',
//           'user.id as user_id',
//           'guide.firstName as guide_first_name',
//           'guide.lastName as guide_last_name',
//           'guide.id as guide_id',
//           'c_t.tour_package_id as package_id',
//           'c_t.tourist_id as tourist_id',
//           'c_t.stream_time as stream_time',
//         ])
//         .where('c_t.id =:cust_id', {
//           cust_id: p_data.customized_tour_id,
//         })
//         .getRawOne();

//       if (customized_tour.status === CustomizedTourStatus.COMPLETED) {
//         // Handle the case where the tour is already completed
//         socket.emit('BAD_REQUEST', {
//           message: 'We cant change the tour status to hold Once its complete',
//         });
//         return;
//       }
//       const socket_ids = [];
//       // getting master tourist from the database
//       socket_ids[0] = await this.redis_client.get(
//         `message_receiver:${customized_tour.user_id}`,
//       );
//       // to to fetch all the tourist_ids from the server where customized tour id === p_data.customized_tour_id
//       // and send the notification with event to master tourist only that tour has been on hold.

//       const public_tourist_ids = await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .createQueryBuilder('c_t_joinee')
//         .select(['c_t_joinee.id as id'])
//         .where('c_t_joinee.customized_tour_id = :id', {
//           id: p_data.customized_tour_id,
//         })
//         .andWhere('status IN (:...statuses_of_joinee)', {
//           statuses_of_joinee: [
//             JoineeStatus.WAITING,
//             JoineeStatus.ACTIVE,
//             JoineeStatus.PENDING,
//             JoineeStatus.INACTIVE,
//           ],
//         })
//         .getRawMany();

//       for (const public_tour_id of public_tourist_ids) {
//         const socket_id = await this.redis_client.get(
//           `message_receiver:${public_tour_id.id}`,
//         );
//         socket_ids.push(socket_id);
//       }
//       this.logger.debug('these are public tourist ids', public_tourist_ids);
//       this.logger.debug('customized _tour on hold fired by guide.');

//       const resp = {
//         message: `~${customized_tour.guide_first_name
//           .split(' ')
//           .join(',')},${customized_tour.guide_last_name
//           .split(' ')
//           .join(
//             ',',
//           )}~ has Put Customized Tour With id On Hold ~${customized_tour.id
//           .split(' ')
//           .join(',')}`,

//         resources: [
//           `${process.env.WEB_APP_ADDRESS}/guide/${customized_tour.guide_id}`,
//           `${process.env.WEB_APP_ADDRESS}/tour/${customized_tour.package_id}`,
//         ],

//         type: NotiTypeEnum.ON_HOLD,
//       };

//       const notification = this.data_source
//         .getRepository(TouristNotification)
//         .create({
//           message: resp.message,
//           resources: resp.resources,
//           type: resp.type,
//           tourist_id: customized_tour.tourist_id,
//         });

//       const noti_saved = await this.data_source
//         .getRepository(TouristNotification)
//         .save(notification);
//       this.logger.log(
//         JSON.stringify(public_tourist_ids),
//         ` Going to send on hold event to these phones`,
//       );
//       this.server.to(socket_ids).emit('customize_tour_on_hold', noti_saved);

//       const ids: string[] = [];

//       for (const public_tour_id of public_tourist_ids) {
//         ids.push(public_tour_id.id);
//       }
//       if (ids.length > 1) {
//         await this.data_source
//           .getRepository(CustomizedTourJoinee)
//           .createQueryBuilder()
//           .update(CustomizedTourJoinee)
//           .set({ status: JoineeStatus.PENDING })
//           .where('id IN (:...public_tourist_ids)', {
//             public_tourist_ids: ids,
//           })
//           .execute();
//       }

//       const right_time = +customized_tour.stream_time + +p_data.stream_time;
//       await this.data_source
//         .getRepository(CustomizedTour)
//         .update(p_data.customized_tour_id, {
//           status: CustomizedTourStatus.ON_HOLD,
//           actual_end_time: new Date(),
//           stream_time: right_time,
//         });
//     } catch (error) {
//       this.logger.error('Error:', error);
//       socket.emit('INTERNAL_SERVER_ERROR', error);
//     }
//   }
//   // this event will be fired by guide when he hit tour complete button.
//   async send_customized_tour_end_event(req: CustomizedTourEndDTO) {
//     if (req.customizeTourStatus !== 'COMPLETED') {
//       this.logger.warn('Customized tour status is Not Completed');
//     }
//     this.logger.warn(
//       `Going to send the customized tour completed event in the room ${req.customizeTourId}`,
//     );

//     const joinee_tourist_ids = await this.data_source
//       .getRepository(CustomizedTourJoinee)
//       .createQueryBuilder('c_t_joinee')
//       .select(['c_t_joinee.id as id'])
//       .getRawMany();

//     this.logger.log(joinee_tourist_ids, 'joinee coming from the database');
//     this.logger.debug(
//       joinee_tourist_ids,
//       'joinee tourist Ids In send Customized tour End Event',
//     );
//     const joinee_ids = [];
//     const socket_ids = [];

//     for (let i = 0; i < joinee_tourist_ids.length; i++) {
//       joinee_ids.push(joinee_tourist_ids[i].id);
//       const socket_id = await this.redis_client.get(
//         `message_receiver:${joinee_tourist_ids[i].id}`,
//       );
//       socket_ids.push(socket_id);
//     }

//     const customized_tour: {
//       user_id: string;
//       tourist_id: string;
//       guide_id: string;
//       guide_first_name: string;
//       guide_last_name: string;
//     } = await this.data_source
//       .getRepository(CustomizedTour)
//       .createQueryBuilder('c_t')
//       .leftJoin('c_t.tourist', 'tourist')
//       .leftJoin('c_t.tour_guide', 'tour_guide')
//       .leftJoin('tourist.user', 'user')
//       .select([
//         'user.id as user_id',
//         'tourist.id as tourist_id',
//         'tour_guide.id as guide_id',
//         'tour_guide.firstName as guide_first_name',
//         'tour_guide.lastName as guide_last_name',
//       ])
//       .where('c_t.id = :id', { id: req.customizeTourId })
//       .getRawOne();

//     const master_socket_id = await this.redis_client.get(
//       `message_receiver:${customized_tour.user_id}`,
//     );

//     socket_ids.push(master_socket_id);
//     const resp = {
//       message: `~${customized_tour.guide_first_name
//         .split(' ')
//         .join(',')},${customized_tour.guide_last_name
//         .split(' ')
//         .join(
//           ',',
//         )}~ has Completed Customized Tour With id ~${req.customizeTourId
//         .split(' ')
//         .join(',')}`,

//       resources: [
//         `${process.env.WEB_APP_ADDRESS}/guide/${customized_tour.guide_id}`,
//         `${process.env.WEB_APP_ADDRESS}/tour/${customized_tour.guide_id}`,
//       ],

//       type: NotiTypeEnum.CustomizedTourCompleted,
//     };

//     const notification = this.data_source
//       .getRepository(TouristNotification)
//       .create({
//         message: resp.message,
//         resources: resp.resources,
//         type: resp.type,
//         tourist_id: customized_tour.tourist_id,
//       });

//     const noti_saved = await this.data_source
//       .getRepository(TouristNotification)
//       .save(notification);
//     this.server.to(socket_ids).emit('customized_tour_completed', noti_saved);

//     this.logger.debug(
//       joinee_ids,
//       'going to delete these joinees from the database',
//     );

//     if (joinee_ids.length > 1) {
//       await this.data_source
//         .getRepository(CustomizedTourJoinee)
//         .createQueryBuilder()
//         .update(CustomizedTourJoinee)
//         .set({ status: JoineeStatus.DONE })
//         .where('id IN (:...ids)', { ids: joinee_ids })
//         .andWhere('customized_tour_id = :id', { id: req.customizeTourId })
//         .andWhere('status =:_status', { _status: JoineeStatus.ACTIVE })
//         .execute();
//     }
//   }

//   async send_customized_tour_cancel_event(req: CustomizedTourCancelDTO) {
//     this.logger.log(
//       JSON.stringify(req),
//       'user cancel customized tour request in socket',
//     );
//     if (req.canceledBy === CancelByEnum.TOUR_GUIDE) {
//       //! send notification to tourist.
//       this.logger.log(
//         'request to emit message of tour canceled by guide is received',
//       );
//       const resp = {
//         message: `~${req.guideFirstName
//           .split(' ')
//           .join(',')},${req.guideLastName
//           .split(' ')
//           .join(
//             ',',
//           )}~ has Canceled Customized Tour With id ~${req.customizedTourId
//           .split(' ')
//           .join(',')}`,

//         resources: [
//           `${process.env.WEB_APP_ADDRESS}/guide/${req.userProfileId}`,
//           `${process.env.WEB_APP_ADDRESS}/tour/${req.tourPackageId}`,
//         ],

//         type: NotiTypeEnum.CustomizedTourCancel,
//       };

//       const notification = this.data_source
//         .getRepository(TouristNotification)
//         .create({
//           message: resp.message,
//           resources: resp.resources,
//           type: resp.type,
//           tourist_id: req.touristId,
//         });

//       const noti_saved = await this.data_source
//         .getRepository(TouristNotification)
//         .save(notification);

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${req.touristPhoneNumber}`,
//       );
//       this.logger.debug(
//         ' just before sending customized tour cancel by guide event',
//       );
//       this.logger.log(
//         `deny event going to tourist with id ${req.touristPhoneNumber}`,
//       );

//       const notification_token = await this.data_source
//         .getRepository(NotificationToken)
//         .findOne({
//           where: {
//             user_id: req.touristPhoneNumber,
//             status: 'ACTIVE',
//           },
//         });

//       if (notification_token) {
//         firebase.messaging().send({
//           token: notification_token.token,
//           notification: {
//             title: 'Customized Tour Cancelled',
//             body: `TourGuide Cancelled Customized Tour`,
//           },

//           data: { data: JSON.stringify(req) },
//         });

//         const entity_model = PushNotificationMapper.toPersistence({
//           data: JSON.stringify(req),
//           title: 'Customized Tour Cancelled',
//           body: `TourGuide Cancelled Customized Tour`,
//           direction: NotificationDirection.GUIDE_TO_TOURIST,
//           notification_tokens: [notification_token.id],
//         });

//         await this.data_source
//           .getRepository(PushNotification)
//           .save(entity_model);
//       }
//       if (socket_id) {
//         this.server.to(socket_id).emit('cust_tour_cancel_by_guide', noti_saved);
//       }
//     } else if (req.canceledBy === CancelByEnum.TOURIST) {
//       //! send notificaiton to guide.

//       const notification_token = await this.data_source
//         .getRepository(NotificationToken)
//         .findOne({
//           where: {
//             user_id: req.guidePhoneNumber,
//             status: 'ACTIVE',
//           },
//         });

//       const message = {
//         ...req,
//         name: `${req.touristFirstName} ${req.touristLastName}`,
//         navigation: 'chats',
//         profile_pic: req.touristProfilePic,
//         tourist_id: req.touristId,
//       };

//       if (notification_token) {
//         firebase.messaging().send({
//           token: notification_token.token,
//           notification: {
//             title: 'Customized Tour Cancelled',
//             body: `Tourist Cancelled Customized Tour`,
//           },

//           data: {
//             data: JSON.stringify(message),
//           },
//         });

//         const entity_model = PushNotificationMapper.toPersistence({
//           data: JSON.stringify(req),
//           title: 'Customized Tour Cancelled',
//           body: `Tourist Cancelled Customized Tour`,
//           direction: NotificationDirection.TOURIST_TO_GUIDE,
//           notification_tokens: [notification_token.id],
//         });

//         await this.data_source
//           .getRepository(PushNotification)
//           .save(entity_model);
//       }

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${req.guidePhoneNumber}`,
//       );

//       this.logger.debug(
//         `just before sending customized tour cancel by tourist ${req.guidePhoneNumber} having socket_id ${socket_id}`,
//       );
//       if (socket_id) {
//         this.server.to(socket_id).emit('cust_tour_cancel_by_tourist', req);
//       }
//     }
//   }
//   // This event will fire by guide and listen by tourist when guide start the tour.
//   async send_customized_tour_start_event(data: SendCustomizedTourStartEvent) {
//     const socket_ids = [];
//     socket_ids[0] = await this.redis_client.get(
//       `message_receiver:${data.tourist_id}`, // tourist id is phone number from inside
//     );

//     const public_tourist_ids = await this.data_source
//       .getRepository(CustomizedTourJoinee)

//       .createQueryBuilder('c_t_joinee')
//       .select(['c_t_joinee.id as id'])
//       .where('c_t_joinee.customized_tour_id = :id', {
//         id: data.customized_tour_id,
//       })
//       .andWhere('status IN (:...statuses_of_joinee)', {
//         statuses_of_joinee: [
//           JoineeStatus.PENDING,
//           JoineeStatus.WAITING,
//           JoineeStatus.INACTIVE,
//         ],
//       })
//       .getRawMany();

//     for (const public_tourist of public_tourist_ids) {
//       const socket_id = await this.redis_client.get(
//         `message_receiver:${public_tourist.id}`,
//       );
//       socket_ids.push(socket_id);
//     }
//     const resp = {
//       message: `~${data.guide_first_name
//         .split(' ')
//         .join(',')},${data.guide_last_name
//         .split(' ')
//         .join(
//           ',',
//         )}~ has Started Customized Tour With id ~${data.customized_tour_id
//         .split(' ')
//         .join(',')}`,

//       resources: [
//         `${process.env.WEB_APP_ADDRESS}/guide/${data.guide_id}`,
//         `${process.env.WEB_APP_ADDRESS}/tour/${data.customized_tour_id}`,
//       ],

//       type: NotiTypeEnum.CustomizeTourStart,
//     };

//     const notification = this.data_source
//       .getRepository(TouristNotification)
//       .create({
//         message: resp.message,
//         resources: resp.resources,
//         type: resp.type,
//         tourist_id: data.tourist_id,
//       });

//     const noti_saved = await this.data_source
//       .getRepository(TouristNotification)
//       .save(notification);

//     // Need to add the public tourists too and to send the event of cust_tour_started to all the public tourist too.
//     this.logger.log(
//       JSON.stringify(public_tourist_ids),
//       `customized tour started event sent`,
//     );
//     this.server.to(socket_ids).emit('customized_tour_started', noti_saved);
//   }
//   // this event will be fired when guide start the tour.
//   async join_customized_tour_room(req: CreateCustomizeTourDTO) {
//     try {
//       this.logger.debug(
//         req.socketId,
//         req.tourGuideId,
//         req.customizedTourId,
//         'info to start tour coming from req',
//       );

//       const arr_of_sockets = await this.server.fetchSockets();

//       const needed_socket = arr_of_sockets.find(
//         (socket) => socket.id === req.socketId,
//       );

//       if (!needed_socket) {
//         needed_socket.emit('BAD_REQUEST', {
//           message: 'Needed socket not found',
//         });
//         this.logger.error('needed socket not found When guide start the tour.');
//         return new WsException('No socket instance found');
//       }

//       // // Check if room_name is valid

//       needed_socket.join(req.customizedTourId);

//       if (req.tourGuideId) {
//         this.logger.debug('going to create the room');
//         this.server.to(req.socketId).emit('customized_room_created', {
//           tour_guide_id: req.tourGuideId,
//           socket_id: req.socketId,
//         });
//         return;
//       }
//       this.logger.log(`Customized tour room Created`);
//       return { result: 'Customized Tour Room Created' };
//     } catch (error) {
//       this.server.to(req.socketId).emit('INTERNAL_SERVER_ERROR');
//       throw error;
//     }
//   }
//   // this event will be fired by both master and public tourist and listen by whole room.
//   @SubscribeMessage('tourist_joined')
//   async tourist_joined(
//     @MessageBody() data: TouristJoinedDTO,
//     @ConnectedSocket() socket: Socket,
//   ): Promise<void> {
//     try {
//       const { customized_tour_id, ...data_to_send } = data;

//       const socket_id = await this.redis_client.get(
//         `message_receiver:${data_to_send.profile_id}`,
//       );

//       if (!socket_id) {
//         this.logger.log(
//           `Going to send the bad request error bcz socket not found`,
//         );
//         socket.emit('BAD_REQUEST', { message: 'Socket Id not Exist' });
//         return;
//       }

//       this.server
//         .to(customized_tour_id)
//         .emit('cust_tourist_joined', data_to_send);

//       await this.join_room(socket_id, customized_tour_id, null);

//       this.logger.log('Tourist Joined room event sent');
//     } catch (error) {
//       socket.emit('BAD_REQUEST', {
//         message: 'problem in tourist joined occured',
//       });

//       this.logger.error(error);
//     }
//   }

//   @SubscribeMessage('group_message')
//   async sendMessageInGroup(
//     @MessageBody() message: string,
//     @ConnectedSocket() socket: Socket,
//   ): Promise<void | WsException> {
//     try {
//       this.logger.debug(JSON.stringify(message), 'message for group');
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       const { message_text, tour_guide_id, customized_tour_id } =
//         JSON.parse(message);

//       const tour_guide = await this.data_source
//         .getRepository(TourGuide)
//         .findOne({
//           relations: ['user'],
//           select: {
//             id: true,
//           },
//           where: {
//             user: {
//               id: tour_guide_id,
//             },
//           },
//         });

//       const arr_of_socket_in_room = await this.server
//         .in(customized_tour_id)
//         .fetchSockets();

//       if (arr_of_socket_in_room.length < 1) {
//         socket.emit('BAD_REQUEST', {
//           message: 'The room name is invalid Or Tour Has not started',
//         });
//         return;
//       }

//       const sender = await this.redis_client.hGetAll(
//         `message_sender:${socket.id}`,
//       );

//       const tourist = await this.data_source.getRepository(Tourist).findOne({
//         relations: ['user'],
//         select: {
//           id: true,
//         },
//         where: {
//           user: {
//             id: sender.profile_id,
//           },
//         },
//       });
//       const group_chat = new GroupChat();
//       if (!tourist) {
//         group_chat.public_tourist_id = sender.profile_id;
//       }
//       // console.log(sender, 'sender');
//       if (sender.role === UserRole.TOURIST) {
//         this.logger.log(`Going to send message to tourist`);
//         group_chat.customized_tour_id = customized_tour_id;
//         group_chat.direction = Direction.TOURIST_TO_ROOM;
//         group_chat.message = message_text;
//         group_chat.tour_guide_id = tour_guide.id;
//         group_chat.tourist_id = tourist?.id;
//         socket.broadcast.to(customized_tour_id).emit('message_from_tourist', {
//           message_text,

//           direction: Direction.TOURIST_TO_ROOM,

//           sender_id: sender.profile_id,

//           tour_guide_id,
//         });
//       }

//       if (sender.role === UserRole.TOUR_GUIDE) {
//         this.logger.log(`Going to send message to guide`);
//         group_chat.customized_tour_id = customized_tour_id;
//         group_chat.direction = Direction.GUIDE_TO_ROOM;
//         group_chat.message = message_text;
//         group_chat.tour_guide_id = tour_guide.id;
//         socket.broadcast.to(customized_tour_id).emit('message_from_guide', {
//           customized_tour_id,

//           message_text,

//           direction: Direction.GUIDE_TO_ROOM,

//           sender_id: sender.profile_id,
//         });
//       }
//       this.logger.debug(
//         JSON.stringify(group_chat),
//         'this message going to be save as group chat',
//       );

//       await this.data_source.getRepository(GroupChat).save(group_chat);
//     } catch (err) {
//       this.logger.debug(JSON.stringify(error));
//       socket.emit('INTERNAL_SERVER_ERROR', { error: err.message });
//     }
//   }

//   @SubscribeMessage('leave_cust_room')
//   async leave_cust_room(
//     @MessageBody() data: LeaveCustRoomDTO,
//     @ConnectedSocket() socket: Socket,
//   ): Promise<void> {
//     const user = await this.redis_client.hGetAll(`message_sender:${socket.id}`);

//     const room_id = data.room_id;

//     if (room_id) {
//       // For tourguide to listen on this event.
//       this.server.to(room_id).emit('user_leave', {
//         socket_id: socket.id,
//         profile_id: user.profile_id,
//         leftee_name: data.leftee_name,
//       });
//       // For tourist to listen on this event.
//       this.server.to(room_id).emit('user_leave_cust_room', {
//         socket_id: socket.id,
//         profile_id: user.profile_id,
//         leftee_name: data.leftee_name,
//       });

//       socket.leave(room_id);
//       this.logger.log(`customized tour room leave events sent`);
//     }
//     // if user being leaving the room is public tourist than change the status to PENDING.
//     const public_tourist_exist = await this.data_source
//       .getRepository(CustomizedTourJoinee)
//       .exist({
//         where: {
//           id: user.profile_id,
//           status: Not(Equal(JoineeStatus.CANCELED)),
//         },
//       });

//     if (public_tourist_exist) {
//       await this.data_source.getRepository(CustomizedTourJoinee).update(
//         { id: user.profile_id },
//         {
//           status: JoineeStatus.PENDING,
//         },
//       );
//     }
//   }

//   @SubscribeMessage('exit_waiting_screen')
//   async exit_wating_screen(
//     @MessageBody() data: ExitScreenDTO,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     this.logger.log(JSON.stringify(data));
//     await this.data_source.getRepository(CustomizedTourJoinee).update(
//       { id: data.joinee_id },
//       {
//         status: JoineeStatus.PENDING,
//       },
//     );
//     const { user_id } = await this.data_source
//       .getRepository(Tourist)
//       .createQueryBuilder('tourist')
//       .innerJoin('tourist.user', 'user')
//       .select('user.id as user_id')
//       .where('tourist.id =:tourist_id', {
//         tourist_id: data.master_tourist_id,
//       })
//       .getRawOne();

//     const socket_id = await this.redis_client.get(
//       `message_receiver:${user_id}`,
//     );

//     if (!socket_id) {
//       socket.emit('BAD_REQUEST', { message: 'socket id of tourist not found' });
//       return;
//     }

//     this.server
//       .to(socket_id)
//       .emit('waiting_screen_exited', { joinee_id: data.joinee_id });
//   }

//   @SubscribeMessage('orientation')
//   send_orientation(
//     @MessageBody() data: string,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const { orientation, customized_tour_id } = JSON.parse(data);
//       this.logger.debug(data, 'receive this data');

//       socket.broadcast
//         .to(customized_tour_id)
//         .emit('orientation_rec', { orientation: orientation });
//     } catch (error) {
//       socket.emit('INTERNAL_SERVER_ERROR', { error: error.message });
//     }
//   }
// }
