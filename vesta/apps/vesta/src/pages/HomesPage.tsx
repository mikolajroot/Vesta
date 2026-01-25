import { useEffect, useState } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { homesAPI, Home, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import HouseIcon from '@mui/icons-material/House';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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

interface CreateHomeForm {
  name: string;
}

interface RenameForm {
  name: string;
}

const createHomeSchema = Yup.object({
  name: Yup.string()
    .required('Home name is required')
    .min(3, 'Name must be at least 3 characters'),
});

const renameHomeSchema = Yup.object({
  name: Yup.string()
    .required('Home name is required')
    .min(3, 'Name must be at least 3 characters'),
});

export function HomesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);
  const [usernames, setUsernames] = useState<Record<number, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [homeToDelete, setHomeToDelete] = useState<number | null>(null);

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
      const homesData = res.data || [];
      setHomes(homesData);

      // Collect all unique user IDs
      const allUserIds = new Set<number>();
      homesData.forEach(home => {
        home.users_id.forEach(id => allUserIds.add(id));
      });

      // Fetch usernames for all user IDs
      const usernameMap: Record<number, string> = {};
      await Promise.all(
        Array.from(allUserIds).map(async (userId) => {
          try {
            const userRes = await usersAPI.getById(userId);
            usernameMap[userId] = userRes.data.username;
          } catch {
            usernameMap[userId] = `User ${userId}`;
          }
        })
      );
      setUsernames(usernameMap);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load homes'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHome = async (
    values: CreateHomeForm,
    helpers: FormikHelpers<CreateHomeForm>,
  ) => {
    if (!user) return;
    try {
      await homesAPI.create(values.name, user.sub);
      await fetchHomes();
      helpers.resetForm();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create home'));
    } finally {
      helpers.setSubmitting(false);
    }
  };

  const openRename = (home: Home) => {
    setSelectedHome(home);
    setRenameOpen(true);
  };

  const handleRenameHome = async (
    values: RenameForm,
    helpers: FormikHelpers<RenameForm>,
  ) => {
    if (!selectedHome) return;
    try {
      await homesAPI.update(selectedHome.id, values.name);
      await fetchHomes();
      setRenameOpen(false);
      setSelectedHome(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to rename home'));
    } finally {
      helpers.setSubmitting(false);
    }
  };



  const requestDeleteHome = (homeId: number) => {
    setHomeToDelete(homeId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHome = async () => {
    if (!user || homeToDelete == null) return;
    try {
      await homesAPI.delete(homeToDelete, user.sub);
      await fetchHomes();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete home';
      setError(message);
    } finally {
      setDeleteDialogOpen(false);
      setHomeToDelete(null);
    }
  };

  const copyInvite = async (code?: string) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
  };

  const handleRemoveUser = async (homeId: number, memberId: number, ownerId: number) => {
    if (!user) return;
    if (memberId === ownerId) {
      setError('Owner cannot be removed');
      return;
    }
    try {
      await homesAPI.removeUser(homeId, memberId, user.sub);
      await fetchHomes();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove user'));
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
        <Stack direction="row" spacing={1} alignItems="center">
          <HouseIcon color="primary" />
          <Typography variant="h4" fontWeight={700}>
            Homes
          </Typography>
        </Stack>
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
        <Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Create Home
                </Typography>
                <Formik
                  initialValues={{ name: '' }}
                  validationSchema={createHomeSchema}
                  onSubmit={handleCreateHome}
                >
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
                      >
                        {user?.role !== 'Admin'
                          ? 'Admin role required'
                          : 'Create home'}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Your Homes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {homes.length === 0 ? (
                  <Typography color="text.secondary">
                    No homes yet. Create one to begin.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {homes.map((home) => (
                      <Grid size={{ xs: 12, sm: 12 }} key={home.id}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Box>
                              <Typography variant="h6">{home.name}</Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Rooms: {home.Room?.length ?? 0}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Members: {home.users_id?.length ?? 0}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Chip
                                  size="small"
                                  label={`Code: ${home.invite_code || 'N/A'}`}
                                />
                                <Button
                                  size="small"
                                  startIcon={<ContentCopyIcon />}
                                  onClick={() => copyInvite(home.invite_code)}
                                >
                                  Copy
                                </Button>
                              </Stack>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Members
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  {(home.users_id ?? []).length === 0 ? (
                                    <Typography color="text.secondary">No members yet.</Typography>
                                  ) : (
                                    (home.users_id ?? []).map((memberId) => {
                                      const isOwner = home.owner_id === memberId;
                                      const canRemove = user?.sub === home.owner_id && !isOwner;
                                      const username = usernames[memberId] || `User ${memberId}`;
                                      return (
                                        <Stack key={memberId} direction="row" alignItems="center" spacing={1}>
                                          <Chip size="small" label={`${username}${isOwner ? ' (owner)' : ''}`} />
                                          <Tooltip title={canRemove ? 'Remove user' : isOwner ? 'Owner cannot be removed' : 'Only owner can remove'}>
                                            <span>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                disabled={!canRemove}
                                                onClick={() => handleRemoveUser(home.id, memberId, home.owner_id)}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                        </Stack>
                                      );
                                    })
                                  )}
                                </Stack>
                              </Box>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => openRename(home)}
                              >
                                Rename
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={() => requestDeleteHome(home.id)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Rename Home</DialogTitle>
        <Formik
          initialValues={{ name: selectedHome?.name ?? '' }}
          enableReinitialize
          validationSchema={renameHomeSchema}
          onSubmit={handleRenameHome}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Field
                  as={TextField}
                  name="name"
                  label="New name"
                  fullWidth
                  margin="dense"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  Save
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete home</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this home?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteHome} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HomesPage;
