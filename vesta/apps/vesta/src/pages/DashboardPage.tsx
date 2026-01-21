import  { useEffect, useMemo, useState } from 'react';
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
    const totalRooms = homes.reduce((sum, h) => sum + (h.Room?.length || 0), 0);
    const totalDevices = homes.reduce(
      (sum, h) =>
        sum + (h.Room?.reduce((rSum, r) => rSum + (r.Devices?.length || 0), 0) || 0),
      0,
    );
    const totalMembers = homes.reduce((sum, h) => sum + (h.users_id?.length || 0), 0);
    return {
      homes: homes.length,
      rooms: totalRooms,
      devices: totalDevices,
      members: totalMembers,
    };
  }, [homes]);

  const handleCreateHome = async (
    values: CreateHomeForm,
    helpers: FormikHelpers<CreateHomeForm>,
  ) => {
    if (!user) return;
    try {
      await homesAPI.create(values.name);
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
  return <></>
}

export default DashboardPage;
