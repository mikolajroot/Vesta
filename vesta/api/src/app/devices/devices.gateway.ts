import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

interface DeviceUpdate {
  deviceId: number;
  roomId: number;
  status: string;
  name: string;
  type: string;
  changedBy: number;
  timestamp: Date;
}

interface EnergyUpdate {
  deviceId: number;
  roomId: number;
  powerW: number;
  energyKwh: number;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: 'devices',
})
@Injectable()
export class DevicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userRooms: Map<string, number> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.userRooms.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, data: { roomId: number }) {
    this.userRooms.set(client.id, data.roomId);
    client.join(`room-${data.roomId}`);
    console.log(`Client ${client.id} joined room ${data.roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, data: { roomId: number }) {
    client.leave(`room-${data.roomId}`);
    this.userRooms.delete(client.id);
    console.log(`Client ${client.id} left room ${data.roomId}`);
  }

  @SubscribeMessage('updateDevice')
  handleUpdateDevice(client: Socket, data: DeviceUpdate) {
    const roomId = this.userRooms.get(client.id);
    if (!roomId || roomId !== data.roomId) {
      return;
    }

    this.server.to(`room-${data.roomId}`).emit('deviceUpdated', data);
    console.log(`Device ${data.deviceId} updated in room ${data.roomId}`);
  }

  broadcastDeviceUpdate(data: DeviceUpdate) {
    this.server.to(`room-${data.roomId}`).emit('deviceUpdated', data);
  }

  broadcastEnergyUpdate(data: EnergyUpdate) {
    this.server.to(`room-${data.roomId}`).emit('energyUpdate', data);
  }
}