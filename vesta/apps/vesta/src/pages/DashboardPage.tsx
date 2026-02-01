import  { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import AddHomeIcon from '@mui/icons-material/House';
import GroupIcon from '@mui/icons-material/Groups';
import KeyIcon from '@mui/icons-material/Key';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { homesAPI, Home } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


interface CreateHomeForm {
  name: string;
}

interface JoinHomeForm {
  inviteCode: string;
}

const createHomeSchema = Yup.object({
  name: Yup.string().required('Home name is required').min(3, 'Name must be at least 3 characters'),
});

const joinHomeSchema = Yup.object({
  inviteCode: Yup.string().required('Invitation code is required'),
});

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchHomes = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await homesAPI.getAll(user.sub);
      setHomes(res.data || []);
    } catch (err) {
      const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to load homes';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {

    const uniqueMembers = new Set<number>();
    homes.forEach((h) => {
      h.users_id?.forEach((userId) => {
        uniqueMembers.add(userId);
      });
    });

    return {
      homes: homes.length,
      members: uniqueMembers.size,
    };
  }, [homes]);

  const handleCreateHome = async (
    values: CreateHomeForm,
    helpers: FormikHelpers<CreateHomeForm>,
  ) => {
    if (!user) return;
    try {
      await homesAPI.create(values.name,user.sub);
      await fetchHomes();
      helpers.resetForm();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to create home';
      setError(message);
    } finally {
      helpers.setSubmitting(false);
    }
  };

  const handleJoinHome = async (
    values: JoinHomeForm,
    helpers: FormikHelpers<JoinHomeForm>,
  ) => {
    if (!user) return;
    try {
      await homesAPI.addUser(values.inviteCode, user.sub);
      await fetchHomes();
      helpers.resetForm();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to join home';
      setError(message);
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Smart Home Overview
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor homes, rooms, and devices at a glance.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={`Role: ${user?.role ?? 'N/A'}`} color="primary" />
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {[{
              label: 'Homes',
              value: stats.homes,
              icon: <AddHomeIcon color="primary" />, }, {
              label: 'Members',
              value: stats.members,
              icon: <GroupIcon color="success" />, },
            ].map((card) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
                <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {card.icon}
                    <Box>
                      <Typography variant="h6">{card.label}</Typography>
                      <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AddHomeIcon color="primary" />
                  <Typography variant="h6">Create Home</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create a new home to manage its rooms and devices.
                </Typography>
                <Formik initialValues={{ name: '' }} validationSchema={createHomeSchema} onSubmit={handleCreateHome}>
                  {({ errors, touched, isSubmitting }) => (
                    <Form>
                      <Field
                        as={TextField}
                        name="name"
                        label="Home name"
                        fullWidth
                        margin="normal"
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        disabled={isSubmitting || user?.role !== 'Admin'}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting || user?.role !== 'Admin'}
                        startIcon={isSubmitting ? <CircularProgress size={18} /> : <AddHomeIcon />}
                      >
                        {user?.role !== 'Admin' ? 'Admin role required' : 'Create home'}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <KeyIcon color="secondary" />
                  <Typography variant="h6">Join Home</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Join an existing home using an invitation code shared by an Admin.
                </Typography>
                <Formik initialValues={{ inviteCode: '' }} validationSchema={joinHomeSchema} onSubmit={handleJoinHome}>
                  {({ errors, touched, isSubmitting }) => (
                    <Form>
                      <Field
                        as={TextField}
                        name="inviteCode"
                        label="Invitation code"
                        fullWidth
                        margin="normal"
                        error={touched.inviteCode && Boolean(errors.inviteCode)}
                        helperText={touched.inviteCode && errors.inviteCode}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={18} /> : <KeyIcon />}
                      >
                        Join home
                      </Button>
                    </Form>
                  )}
                </Formik>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">Your Homes</Typography>
              <Button variant="text" onClick={() => navigate('/homes')}>
                Go to Homes
              </Button>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {homes.length === 0 ? (
              <Typography color="text.secondary">No homes yet. Create or join one to begin.</Typography>
            ) : (
              <Grid container spacing={2}>
                {homes.map((home) => (
                  <Grid size={{ xs: 12, sm: 12, md: 6 }} key={home.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h6">{home.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Members: {home.users_id?.length ?? 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Rooms: {home.Room?.length ?? 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Code: {home.invite_code || 'N/A'}
                          </Typography>
                        </Box>
                        <Stack spacing={1} alignItems="flex-end">
                          <Button size="small" variant="outlined" onClick={() => navigate('/homes')}>
                            Manage
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

export default DashboardPage;
