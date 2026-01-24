import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { roomsAPI, homesAPI, Room, Home } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return anyErr.response?.data?.message ?? anyErr.message ?? fallback;
  }
  return fallback;
}

interface CreateRoomForm {
  name: string;
  type: string;
  floor: number;
  area: number;
  home_id: number;
}

interface UpdateRoomForm {
  name: string;
  type: 'LIVING_ROOM' | 'BEDROOM' | 'KITCHEN' | 'BATHROOM' | 'GARAGE';
  floor: number;
  area: number;
}

const roomTypes = [
  { value: 'LIVING_ROOM', label: 'Living Room' },
  { value: 'BEDROOM', label: 'Bedroom' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'BATHROOM', label: 'Bathroom' },
  { value: 'GARAGE', label: 'Garage' },
];

const createRoomSchema = Yup.object({
  name: Yup.string()
    .required('Room name is required')
    .min(2, 'Name must be at least 2 characters'),
  type: Yup.string()
    .required('Room type is required')
    .oneOf(['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM', 'GARAGE']),
  floor: Yup.number()
    .required('Floor is required')
    .integer('Floor must be an integer'),
  area: Yup.number()
    .required('Area is required')
    .positive('Area must be positive'),
  home_id: Yup.number()
    .required('Home is required'),
});

const updateRoomSchema = Yup.object({
  name: Yup.string()
    .required('Room name is required')
    .min(2, 'Name must be at least 2 characters'),
  type: Yup.string()
    .required('Room type is required')
    .oneOf(['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM', 'GARAGE']),
  floor: Yup.number()
    .required('Floor is required')
    .integer('Floor must be an integer'),
  area: Yup.number()
    .required('Area is required')
    .positive('Area must be positive'),
});

export function RoomsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homes, setHomes] = useState<Home[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHome, setSelectedHome] = useState<number | null>(null);


  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchHomes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.sub]);

  useEffect(() => {
    if (selectedHome) {
      fetchRooms(selectedHome);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHome]);

  const fetchHomes = async () => {
    if (!user) return;
    try {
      const res = await homesAPI.getAll(user.sub);
      const homesData = res.data || [];
      setHomes(homesData);
      if (homesData.length > 0 && !selectedHome) {
        setSelectedHome(homesData[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load homes'));
    }
  };

  const fetchRooms = async (homeId: number) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await roomsAPI.getAll(homeId, user.sub);
      setRooms(res.data || []);
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        return;
      }
      setError(getErrorMessage(err, 'Failed to load rooms'));
    } finally {
      setLoading(false);
    }
  };




 return <></>
}
