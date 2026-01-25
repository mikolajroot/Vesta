import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import {
  devicesAPI,
  roomsAPI,
  homesAPI,
  Device,
  Room,
  Home,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Form, useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import { Field, Formik, FormikHelpers } from 'formik';

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

interface CreateDeviceForm {
  name: string;
  type: string;
  status: string;
  room_id: number;
  mqtt_topic: string;
}

interface UpdateDeviceForm {
  name: string;
  type: string;
  status: string;
  room_id: number;
  mqtt_topic: string;
}

const deviceTypes = [
  { value: 'light', label: 'Light' },
  { value: 'thermostat', label: 'Thermostat' },
  { value: 'lock', label: 'Lock' },
  { value: 'camera', label: 'Camera' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'switch', label: 'Switch' },
  { value: 'other', label: 'Other' },
];

const deviceStatuses = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'unavailable', label: 'Unavailable' },
];

const createDeviceSchema = Yup.object({
  name: Yup.string()
    .required('Device name is required')
    .min(3, 'Name must be at least 3 characters'),
  type: Yup.string().required('Device type is required'),
  status: Yup.string().required('Device status is required'),
  room_id: Yup.number().required('Room is required'),
  mqtt_topic: Yup.string().optional(),
});

const updateDeviceSchema = Yup.object({
  name: Yup.string()
    .required('Device name is required')
    .min(3, 'Name must be at least 3 characters'),
  type: Yup.string().required('Device type is required'),
  status: Yup.string().required('Device status is required'),
  room_id: Yup.number().required('Room is required'),
  mqtt_topic: Yup.string().optional(),
});

export function DevicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homes, setHomes] = useState<Home[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHome, setSelectedHome] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

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
    } else {
      setRooms([]);
      setSelectedRoom(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHome]);

  useEffect(() => {
    if (selectedRoom) {
      fetchDevices(selectedRoom);
    } else {
      setDevices([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

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
    try {
      const res = await roomsAPI.getAll(homeId, user.sub);
      const roomsData = res.data || [];
      setRooms(roomsData);
      if (roomsData.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsData[0].id);
      }
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        return;
      }
      setError(getErrorMessage(err, 'Failed to load rooms'));
    }
  };

  const fetchDevices = async (roomId: number) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await devicesAPI.getAll(roomId);
      setDevices(res.data || []);
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        return;
      }
      setError(getErrorMessage(err, 'Failed to load devices'));
    } finally {
      setLoading(false);
    }
  };

   const handleCreateDevice = async (
    values: CreateDeviceForm,
    helpers: FormikHelpers<CreateDeviceForm>,
  ) => {
    if (!user) return;
    try {
      await devicesAPI.create(values);
      if (selectedRoom) {
        await fetchDevices(selectedRoom);
      }
      helpers.resetForm();
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create device'));
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <DevicesIcon fontSize="large" color="primary" />
        <Typography variant="h4">Devices</Typography>
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

        {/* Room Selector */}
        {selectedHome && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select Room
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {rooms.map((room) => (
                  <Chip
                    key={room.id}
                    label={room.name}
                    color={selectedRoom === room.id ? 'primary' : 'default'}
                    onClick={() => setSelectedRoom(room.id)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}

          {/* Create Device Form */}
        {user && user.role === 'Admin' && selectedRoom && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Create Device
              </Typography>
              <Formik
                initialValues={{
                  name: '',
                  type: 'light',
                  status: 'off',
                  room_id: selectedRoom,
                  mqtt_topic: '',
                }}
                validationSchema={createDeviceSchema}
                onSubmit={handleCreateDevice}
                enableReinitialize
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form>
                    <Stack spacing={2}>
                      <Field
                        as={TextField}
                        name="name"
                        label="Device Name"
                        fullWidth
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                      />
                      <Field
                        as={TextField}
                        name="type"
                        label="Device Type"
                        select
                        fullWidth
                        error={touched.type && Boolean(errors.type)}
                        helperText={touched.type && errors.type}
                      >
                        {deviceTypes.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field>
                      <Field
                        as={TextField}
                        name="status"
                        label="Status"
                        select
                        fullWidth
                        error={touched.status && Boolean(errors.status)}
                        helperText={touched.status && errors.status}
                      >
                        {deviceStatuses.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field>
                      <Field
                        as={TextField}
                        name="mqtt_topic"
                        label="MQTT Topic (optional)"
                        fullWidth
                        error={touched.mqtt_topic && Boolean(errors.mqtt_topic)}
                        helperText={touched.mqtt_topic && errors.mqtt_topic}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                      >
                        Create Device
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
