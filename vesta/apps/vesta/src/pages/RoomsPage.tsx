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
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  home_id: Yup.number().required('Home is required'),
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<number | null>(null);

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

    const handleUpdateRoom = async (
    values: UpdateRoomForm,
    helpers: FormikHelpers<UpdateRoomForm>,
  ) => {
    if (!selectedRoom) return;
    try {
      await roomsAPI.update(selectedRoom.id, values);
      if (selectedHome) {
        await fetchRooms(selectedHome);
      }
      setEditDialogOpen(false);
      setSelectedRoom(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update room'));
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await roomsAPI.delete(roomToDelete);
      if (selectedHome) {
        await fetchRooms(selectedHome);
      }
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete room'));
      setDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedRoom(null);
  };

  const getRoomTypeLabel = (type: string) => {
    return roomTypes.find((rt) => rt.value === type)?.label || type;
  };

  const requestDeleteRoom = (roomId: number) => {
    setRoomToDelete(roomId);
    setDeleteDialogOpen(true);
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
        )}{' '}
        {/* Rooms List */}
        <Grid size={{ xs: 12, md: user && user.role === 'Admin' ? 6 : 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Rooms in Selected Home
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
            ) : rooms.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No rooms yet.{' '}
                {user && user.role === 'Admin' ? 'Create one to begin.' : ''}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {rooms.map((room) => (
                  <Grid size={{ xs: 12 }} key={room.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">{room.name}</Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1 }}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              label={getRoomTypeLabel(room.type)}
                            />
                            <Chip size="small" label={`Floor ${room.floor}`} />
                            <Chip size="small" label={`${room.area} m²`} />
                            <Chip
                              size="small"
                              label={`${room.Devices?.length || 0} devices`}
                              color="primary"
                            />
                          </Stack>
                        </Box>
                        {user && user.role === 'Admin' && (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditDialog(room)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => requestDeleteRoom(room.id)}
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
      {/* Edit Room Dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Formik
              initialValues={{
                name: selectedRoom.name,
                type: selectedRoom.type,
                floor: selectedRoom.floor,
                area: selectedRoom.area,
              }}
              validationSchema={updateRoomSchema}
              onSubmit={handleUpdateRoom}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Stack spacing={2} sx={{ mt: 2 }}>
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
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this room? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRoom} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
