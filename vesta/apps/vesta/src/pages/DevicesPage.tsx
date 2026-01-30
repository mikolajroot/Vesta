import { useEffect, useState, useCallback } from 'react';
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
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Field, Formik, Form as FormikForm, FormikHelpers } from 'formik';
import { useDeviceWebSocket } from '../hooks/useDeviceWebSocket';

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
}

interface UpdateDeviceForm {
  name: string;
  type: string;
  status: string;
  room_id: number;
}

const deviceTypes = [
  { value: 'light', label: 'Light' },
  { value: 'thermostat', label: 'Thermostat' },
  { value: 'lock', label: 'Lock' },
  { value: 'camera', label: 'Camera' },
  { value: 'temp_sensor', label: 'Temperature Sensor' },
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
});

const updateDeviceSchema = Yup.object({
  name: Yup.string()
    .required('Device name is required')
    .min(3, 'Name must be at least 3 characters'),
  type: Yup.string().required('Device type is required'),
  status: Yup.string().required('Device status is required'),
  room_id: Yup.number().required('Room is required'),
});

export function DevicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homes, setHomes] = useState<Home[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [tempSensorReadings, setTempSensorReadings] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHome, setSelectedHome] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<number | null>(null);
  const { updateDevice: emitDeviceUpdate } = useDeviceWebSocket(
    selectedRoom,
    handleWebSocketDeviceUpdate,
  );

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
      if (roomsData.length > 0) {
        setSelectedRoom(roomsData[0].id);
      } else {
        setSelectedRoom(null);
        setDevices([]);
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
      const devicesData = res.data || [];
      setDevices(devicesData);
      setTempSensorReadings((prev) => {
        const next = { ...prev };
        devicesData.forEach((device) => {
          if (device.type === 'temp_sensor' && isNumericStatus(device.status)) {
            next[device.id] = device.status as string;
          }
        });
        return next;
      });
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

  const handleUpdateDevice = async (
    values: UpdateDeviceForm,
    helpers: FormikHelpers<UpdateDeviceForm>,
  ) => {
    if (!selectedDevice) return;
    try {
      await devicesAPI.update(selectedDevice.id, values);
      if (selectedRoom) {
        await fetchDevices(selectedRoom);
      }
      setEditDialogOpen(false);
      setSelectedDevice(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update device'));
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    return deviceTypes.find((dt) => dt.value === type)?.label || type;
  };

  const getDeviceStatusLabel = (status: string) => {
    return deviceStatuses.find((ds) => ds.value === status)?.label || status;
  };

  const isNumericStatus = (status?: string | null) => {
    if (status === null || status === undefined) return false;
    return status !== '' && !Number.isNaN(Number(status));
  };

  const getTempSensorStatusLabel = (device: Device) => {
    if (isNumericStatus(device.status)) return `${device.status}°C`;
    const lastReading = tempSensorReadings[device.id];
    if (lastReading) return `${lastReading}°C`;
    return 'No reading';
  };

  const getTempSensorStatusColor = (device: Device) => {
    if (device.status === 'off') return 'default';
    if (device.status === 'on') return 'success';
    if (isNumericStatus(device.status)) return 'info';
    return 'default';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on':
        return 'success';
      case 'off':
        return 'default';
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      await devicesAPI.delete(deviceToDelete);
      if (selectedRoom) {
        await fetchDevices(selectedRoom);
      }
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete device'));
      setDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedDevice(null);
  };

  const requestDeleteDevice = (deviceId: number) => {
    setDeviceToDelete(deviceId);
    setDeleteDialogOpen(true);
  };



  function handleWebSocketDeviceUpdate(data: any) {
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === data.deviceId
          ? { ...device, status: data.status }
          : device,
      ),
    );
    if (data.type === 'temp_sensor' && isNumericStatus(data.status)) {
      setTempSensorReadings((prev) => ({
        ...prev,
        [data.deviceId]: data.status,
      }));
    }
  }

  const toggleLightStatus = useCallback(
    async (device: Device) => {
      if (device.type !== 'light') return;

      const newStatus = device.status === 'on' ? 'off' : 'on';

      try {

        await devicesAPI.update(device.id, {
          ...device,
          status: newStatus,
        });

        emitDeviceUpdate(device.id, newStatus, device.name, device.type);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to toggle light'));
      }
    },
    [emitDeviceUpdate],
  );

  const toggleTempSensorStatus = useCallback(
    async (device: Device) => {
      if (device.type !== 'temp_sensor') return;

      const nextStatus = device.status === 'off' ? 'on' : 'off';

      try {
        await devicesAPI.update(device.id, {
          ...device,
          status: nextStatus,
        });

        emitDeviceUpdate(device.id, nextStatus, device.name, device.type);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to toggle sensor'));
      }
    },
    [emitDeviceUpdate],
  );

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
                }}
                validationSchema={createDeviceSchema}
                onSubmit={handleCreateDevice}
                enableReinitialize
              >
                {({ errors, touched, isSubmitting }) => (
                  <FormikForm>
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
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                      >
                        Create Device
                      </Button>
                    </Stack>
                  </FormikForm>
                )}
              </Formik>
            </Paper>
          </Grid>
        )}

        {/* Devices List */}
        <Grid
          size={{
            xs: 12,
            md: user && user.role === 'Admin' && selectedRoom ? 6 : 12,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Devices in Selected Room
            </Typography>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !selectedRoom ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                Please select a room to view devices.
              </Typography>
            ) : devices.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No devices yet.{' '}
                {user && user.role === 'Admin' ? 'Create one to begin.' : ''}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {devices.map((device) => (
                  <Grid size={{ xs: 12 }} key={device.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">{device.name}</Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1 }}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              label={getDeviceTypeLabel(device.type)}
                            />
                            {device.type === 'light' ? (
                              <Chip
                                size="small"
                                label={getDeviceStatusLabel(device.status)}
                                color={getStatusColor(device.status)}
                                onClick={() => toggleLightStatus(device)}
                                sx={{ cursor: 'pointer' }}
                              />
                            ) : device.type === 'temp_sensor' ? (
                              <Chip
                                size="small"
                                label={getTempSensorStatusLabel(device)}
                                color={getTempSensorStatusColor(device)}
                                onClick={() => toggleTempSensorStatus(device)}
                                sx={{ cursor: 'pointer' }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={getDeviceStatusLabel(device.status)}
                                color={getStatusColor(device.status)}
                              />
                            )}
                            {device.mqtt_topic && (
                              <Chip
                                size="small"
                                label={`MQTT: ${device.mqtt_topic}`}
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Box>
                        {user && user.role === 'Admin' && (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditDialog(device)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => requestDeleteDevice(device.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Device Dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          {selectedDevice && (
            <Formik
              initialValues={{
                name: selectedDevice.name,
                type: selectedDevice.type,
                status: selectedDevice.status,
                room_id: selectedDevice.room_id,
              }}
              validationSchema={updateDeviceSchema}
              onSubmit={handleUpdateDevice}
            >
              {({ errors, touched, isSubmitting }) => (
                <FormikForm>
                  <Stack spacing={2} sx={{ mt: 2 }}>
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
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button onClick={closeEditDialog}>Cancel</Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                      >
                        Update
                      </Button>
                    </Stack>
                  </Stack>
                </FormikForm>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Device</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this device? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDevice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
