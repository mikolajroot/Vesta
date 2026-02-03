import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface DeviceUpdate {
  deviceId: number;
  roomId: number;
  status: string;
  name: string;
  type: string;
  changedBy: number;
  timestamp: Date;
}

interface DeviceCreated {
  id: number;
  name: string;
  type: string;
  status: string;
  room_id: number;
  mqtt_topic?: string;
  created_at: string;
}

interface DeviceDeleted {
  id: number;
  room_id: number;
}

export function useDeviceWebSocket(
  roomId: number | null,
  onDeviceUpdate: (data: DeviceUpdate | { type: string; data: DeviceCreated | DeviceDeleted }) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const socket = io('https://localhost:3000/devices', {
      auth: {
        token: localStorage.getItem('access_token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to devices gateway');
      socket.emit('joinRoom', { roomId });
    });

    socket.on('deviceUpdated', (data: DeviceUpdate) => {
      onDeviceUpdate(data);
    });

    socket.on('deviceCreated', (data: DeviceCreated) => {
      onDeviceUpdate({ type: 'deviceCreated', data });
    });

    socket.on('deviceDeleted', (data: DeviceDeleted) => {
      onDeviceUpdate({ type: 'deviceDeleted', data });
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      if (socket.connected) {
        socket.emit('leaveRoom', { roomId });
        socket.disconnect();
      }
    };
  }, [roomId, onDeviceUpdate]);

  const updateDevice = useCallback(
    (deviceId: number, status: string, deviceName: string, deviceType: string) => {
      if (socketRef.current && roomId) {
        socketRef.current.emit('updateDevice', {
          deviceId,
          roomId,
          status,
          name: deviceName,
          type: deviceType,
          changedBy: 0,
          timestamp: new Date(),
        });
      }
    },
    [roomId],
  );

  return { updateDevice };
}