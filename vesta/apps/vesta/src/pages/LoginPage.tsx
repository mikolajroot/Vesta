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
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

interface LoginFormValues {
  username: string;
  password: string;
}

const loginValidationSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export function LoginPage() {
  const [localError, setLocalError] = React.useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const initialValues: LoginFormValues = {
    username: '',
    password: '',
  };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    setLocalError(null);

    try {
      await login(values.username, values.password);
      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
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
            Login
          </Typography>

          {localError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={loginValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
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
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Login'}
                </Button>
              </Form>
            )}
          </Formik>

          <Typography align="center" sx={{ mt: 2 }}>
            Don't have an account?{' '}
            <MuiLink component={Link} to="/register">
              Register here
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
