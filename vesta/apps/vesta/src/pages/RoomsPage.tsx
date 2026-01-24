import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { roomsAPI, homesAPI, Room, Home } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { Formik, Form, Field, FormikHelpers } from 'formik';

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

  const handleCreateRoom = async (
    values: CreateRoomForm,
    helpers: FormikHelpers<CreateRoomForm>,
  ) => {
    if (!user) return;
    try {
      await roomsAPI.create(values);
      if (selectedHome) {
        await fetchRooms(selectedHome);
      }
      helpers.resetForm();
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create room'));
    }
  };







  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <MeetingRoomIcon fontSize="large" color="primary" />
        <Typography variant="h4">Rooms</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Home Selector */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select Home
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {homes.map((home) => (
                <Chip
                  key={home.id}
                  label={home.name}
                  color={selectedHome === home.id ? 'primary' : 'default'}
                  onClick={() => setSelectedHome(home.id)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Create Room Form */}
        {user && user.role === 'Admin' && selectedHome && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Create Room
              </Typography>
              <Formik
                initialValues={{
                  name: '',
                  type: 'LIVING_ROOM',
                  floor: 0,
                  area: 0,
                  home_id: selectedHome,
                }}
                validationSchema={createRoomSchema}
                onSubmit={handleCreateRoom}
                enableReinitialize
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form>
                    <Stack spacing={2}>
                      <Field
                        as={TextField}
                        name="name"
                        label="Room Name"
                        fullWidth
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                      />
                      <Field
                        as={TextField}
                        name="type"
                        label="Room Type"
                        select
                        fullWidth
                        error={touched.type && Boolean(errors.type)}
                        helperText={touched.type && errors.type}
                      >
                        {roomTypes.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field>
                      <Field
                        as={TextField}
                        name="floor"
                        label="Floor"
                        type="number"
                        fullWidth
                        error={touched.floor && Boolean(errors.floor)}
                        helperText={touched.floor && errors.floor}
                      />
                      <Field
                        as={TextField}
                        name="area"
                        label="Area (m²)"
                        type="number"
                        fullWidth
                        error={touched.area && Boolean(errors.area)}
                        helperText={touched.area && errors.area}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                      >
                        Create Room
                      </Button>
                    </Stack>
                  </Form>
                )}
              </Formik>
            </Paper>
          </Grid>
        )}
        </Grid>
    </Box>
  );
}
