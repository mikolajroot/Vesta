import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  role: 'Admin' | 'Child';
}

export interface AuthResponse {
  access_token: string;
}

export interface User {
  sub: number;
  username: string;
  role: 'Admin' | 'Child';
}

export interface Home {
  id: number;
  name: string;
  owner_id: number;
  users_id: number[];
  invite_code: string;
  Room?: Room[];
}

export interface Room {
  id: number;
  name: string;
  type: 'LIVING_ROOM' | 'BEDROOM' | 'KITCHEN' | 'BATHROOM' | 'GARAGE';
  floor: number;
  area: number;
  home_id: number;
  Devices?: Device[];
}

export interface Device {
  id: number;
  name: string;
  type: string;
  status: string;
  room_id: number;
  mqtt_topic?: string;
  created_at: string;
}

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),
  register: (credentials: RegisterCredentials) =>
    api.post<AuthResponse>('/auth/signup', credentials),
  getProfile: () => api.get<User>('/auth/profile'),
};

// Users API
export const usersAPI = {
  getById: (userId: number) =>
    api.get<Pick<User, 'sub' | 'username' | 'role'>>(`/users/${userId}`),
};

// Homes API
export const homesAPI = {
  getAll: (userId: number) =>
    api.get<Home[]>(`/homes?userId=${userId}`),
  create: (name: string, userId: number) =>
    api.post<Home>('/homes', { name, userId }),
  delete: (id: number, ownerId: number) =>
    api.delete(`/homes/${id}`, { params: { userId: ownerId } }),
  update: (id: number, name: string) =>
    api.patch<Home>(`/homes/${id}`, { name }),
  addUser: (invitationCode: string, userId: number) =>
    api.patch<Home>('/homes/add-user', {
      invitation_code: invitationCode,
      user_id: userId,
    }),
  removeUser: (homeId: number, userId: number, ownerId: number) =>
    api.delete<Home>(`/homes/${homeId}/users/${userId}`, { params: { ownerId } }),
};

// Rooms API
export const roomsAPI = {
  getAll: (homeId: number) =>
    api.get<Room[]>(`/rooms?homeId=${homeId}`),
  create: (data: {
    name: string;
    type: string;
    floor: number;
    area: number;
    home_id: number;
  }) => api.post<Room>('/rooms', data),
  update: (id: number, data: Partial<Room>) =>
    api.patch<Room>(`/rooms/${id}`, data),
  delete: (id: number) =>
    api.delete(`/rooms/${id}`),
};

// Devices API
export const devicesAPI = {
  getAll: (roomId: number) =>
    api.get<Device[]>(`/devices?roomId=${roomId}`),
  create: (data: {
    name: string;
    type: string;
    status: string;
    room_id: number;
    mqtt_topic?: string;
  }) => api.post<Device>('/devices', data),
  update: (id: number, data: Partial<Device>) =>
    api.patch<Device>(`/devices/${id}`, data),
  delete: (id: number) =>
    api.delete(`/devices/${id}`),
};
