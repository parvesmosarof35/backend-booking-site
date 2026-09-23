import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    return { event: 'joined_room', room };
  }

  // Broadcast Helpers
  emitTableUpdated(tableData: any) {
    this.server?.emit('table_updated', tableData);
  }

  emitSlotUpdated(slotData: any) {
    this.server?.emit('slot_updated', slotData);
  }

  emitBookingCreated(bookingData: any) {
    this.server?.emit('booking_created', bookingData);
  }

  emitBookingStatusChanged(bookingData: any) {
    this.server?.emit('booking_status_changed', bookingData);
  }

  emitOrderCreated(orderData: any) {
    this.server?.emit('order_created', orderData);
  }

  emitOrderStatusChanged(orderData: any) {
    this.server?.emit('order_status_changed', orderData);
  }
}
