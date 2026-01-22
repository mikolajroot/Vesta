import { useEffect, useState } from 'react';

import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { homesAPI, Home } from '../services/api';
import { useAuth } from '../context/AuthContext';

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
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
  name: Yup.string().required('Home name is required').min(3, 'Name must be at least 3 characters'),
});

const renameHomeSchema = Yup.object({
  name: Yup.string().required('Home name is required').min(3, 'Name must be at least 3 characters'),
});

export function HomesPage() {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [homeToDelete, setHomeToDelete] = useState<number | null>(null);

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
      const message = (err instanceof Error ? err.message : 'Failed to delete home');
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

  return (
    <></>
  );
}

export default HomesPage;
