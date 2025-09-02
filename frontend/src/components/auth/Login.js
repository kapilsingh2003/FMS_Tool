import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    IconButton,
    InputAdornment,
    Divider,
    Chip
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Monitor,
    Tv,
    AccountCircle
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';

const validationSchema = Yup.object({
    username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .required('Username is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
        try {
            const result = await login(values.username, values.password);

            if (result.success) {
                toast.success(`Welcome back, ${result.user.name}!`);
                navigate('/dashboard');
            } else {
                setFieldError('password', result.error || 'Login failed');
            }
        } catch (error) {
            setFieldError('password', 'An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    py: 4,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                              {/* Samsung Logo/Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', mr: 1 }}>
              <Monitor color="primary" />
            </Box>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                color: '#0d459c',
                fontWeight: 700,
              }}
            >
              SAMSUNG FMS Portal
            </Typography>
          </Box>

                    <Typography component="h2" variant="h5" sx={{ mb: 1 }}>
                        Sign in to your account
                    </Typography>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Manage FMS keys for Smart Monitors and TVs
          </Typography>

                              <Formik
            initialValues={{
              username: '',
              password: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
                        {({ errors, touched, isSubmitting }) => (
                            <Form style={{ width: '100%' }}>
                                                <Field name="username">
                  {({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Username (Knox ID)"
                      type="text"
                      margin="normal"
                      error={touched.username && !!errors.username}
                      helperText={touched.username && errors.username}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircle color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Field>

                                <Field name="password">
                                    {({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            margin="normal"
                                            error={touched.password && !!errors.password}
                                            helperText={touched.password && errors.password}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={togglePasswordVisibility}
                                                            edge="end"
                                                            aria-label="toggle password visibility"
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                </Field>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={isSubmitting}
                                    sx={{
                                        mt: 3,
                                        mb: 2,
                                        py: 1.5,
                                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                        },
                                    }}
                                >
                                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                                </Button>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2">
                                        Don't have an account?{' '}
                                        <Link
                                            to="/signup"
                                            style={{
                                                color: '#1976d2',
                                                textDecoration: 'none',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Sign up here
                                        </Link>
                                    </Typography>
                                </Box>
                            </Form>
                        )}
                    </Formik>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login; 