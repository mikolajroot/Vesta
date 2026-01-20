import React from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Link as MuiLink,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  role: "Admin" | "Child";
}

const registerValidationSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  role: Yup.string()
    .required('Role is required')
    .oneOf(['Admin', 'Child'], 'Invalid role selected'),
});

export function RegisterPage() {
  const [localError, setLocalError] = React.useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const initialValues: RegisterFormValues = {
    role: 'Child',
    username: '',
    password: '',
    confirmPassword: '',
  };

  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting }: FormikHelpers<RegisterFormValues>
  ) => {
    setLocalError(null);

    try {
      await register(values.username, values.password,values.role);
      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setLocalError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 3 }}
          >
            Smart Home
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="textSecondary"
            sx={{ mb: 3 }}
          >
            Create Account
          </Typography>

          {localError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={registerValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ touched, errors, isSubmitting, values, setFieldValue }) => (
              <Form>
                <Field
                  as={TextField}
                  fullWidth
                  name="username"
                  label="Username"
                  margin="normal"
                  autoFocus
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  disabled={isSubmitting}
                />
                <Field
                  as={TextField}
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  margin="normal"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  disabled={isSubmitting}
                />
                <Field
                  as={TextField}
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  margin="normal"
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  disabled={isSubmitting}
                />
                <FormControl fullWidth margin="normal" error={touched.role && Boolean(errors.role)}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={values.role}
                    label="Role"
                    onChange={(e) => setFieldValue('role', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Child">Child</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Register'}
                </Button>
              </Form>
            )}
          </Formik>

          <Typography align="center" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <MuiLink component={Link} to="/login">
              Login here
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
