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
    IconButton,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Alert
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Monitor,
    Tv,
    AccountCircle,
    Email,
    Work,
    Security
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';

const validationSchema = (isOtpVerified) => Yup.object({
    name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Name is required'),
    knoxId: Yup.string()
        .min(3, 'Knox ID must be at least 3 characters')
        .required('Knox ID is required'),
    password: isOtpVerified ? Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required') : Yup.string().notRequired(),
    confirmPassword: isOtpVerified ? Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required') : Yup.string().notRequired(),
    role: isOtpVerified ? Yup.string()
        .required('Role is required') : Yup.string().notRequired(),
    team: isOtpVerified ? Yup.string()
        .required('Team is required') : Yup.string().notRequired(),
    otp: Yup.string()
        .length(6, 'OTP must be 6 digits')
        .matches(/^[0-9]+$/, 'OTP must contain only numbers')
        .when('isOtpSent', {
            is: true,
            then: (schema) => schema.required('OTP is required'),
            otherwise: (schema) => schema.notRequired(),
        }),
});

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const { signup, USER_ROLES } = useAuth();
    const navigate = useNavigate();

    const teams = [
        'ENT_SM',
        'CTV',
        'ENT_TV'
    ];

    const roleDescriptions = {
        [USER_ROLES.ADMIN]: 'Full access to create and configure projects, manage users',
        [USER_ROLES.REVIEWER]: 'Can review and modify FMS key values within assigned projects',
        [USER_ROLES.VIEWER]: 'Read-only access to view FMS key data and comparisons'
    };

    const sendOtp = async (knoxId) => {
        try {
            // TODO: Replace with actual API call
            // For now, simulate OTP sending
            const email = `${knoxId}@samsung.com`;

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsOtpSent(true);
            toast.success(`OTP sent to ${email}`);
            return { success: true };
        } catch (error) {
            toast.error('Failed to send OTP');
            return { success: false, error: error.message };
        }
    };

    const verifyOtp = async (otp) => {
        try {
            setIsVerifyingOtp(true);
            // TODO: Replace with actual API call
            // For now, simulate OTP verification (accept any 6-digit number)
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (otp === '123456' || otp.length === 6) {
                setIsOtpVerified(true);
                toast.success('OTP verified successfully! You can now complete your registration.');
                return { success: true };
            } else {
                throw new Error('Invalid OTP');
            }
        } catch (error) {
            toast.error('Invalid OTP. Please try again.');
            return { success: false, error: error.message };
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
        try {
            // Check if Knox ID is verified
            if (!isOtpVerified) {
                if (!isOtpSent) {
                    setFieldError('knoxId', 'Please send and verify OTP first');
                } else {
                    setFieldError('otp', 'Please verify OTP before proceeding');
                }
                return;
            }

            const { confirmPassword, otp, ...userData } = values;
            // Convert knoxId to username and generate email
            const signupData = {
                ...userData,
                username: values.knoxId,
                email: `${values.knoxId}@samsung.com`,
                department: values.team
            };

            const result = await signup(signupData);

            if (result.success) {
                toast.success(`Account created successfully! Welcome, ${result.user.name}!`);
                navigate('/dashboard');
            } else {
                setFieldError('knoxId', result.error || 'Signup failed');
            }
        } catch (error) {
            setFieldError('knoxId', 'An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <Container component="main" maxWidth="md">
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
                        Create your account
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        Join the Samsung FMS Key Management Portal to collaborate on smart monitor and TV features
                    </Typography>

                    <Formik
                        initialValues={{
                            name: '',
                            knoxId: '',
                            password: '',
                            confirmPassword: '',
                            role: '',
                            team: '',
                            otp: '',
                        }}
                        validationSchema={validationSchema(isOtpVerified)}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, isSubmitting, values }) => (
                            <Form style={{ width: '100%' }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    <Field name="name">
                                        {({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="Full Name"
                                                margin="normal"
                                                error={touched.name && !!errors.name}
                                                helperText={touched.name && errors.name}
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

                                    <Field name="knoxId">
                                        {({ field }) => (
                                            <Box>
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Knox ID"
                                                    type="text"
                                                    margin="normal"
                                                    error={touched.knoxId && !!errors.knoxId}
                                                    helperText={touched.knoxId && errors.knoxId}
                                                    disabled={isOtpSent}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Email color="action" />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: !isOtpSent && field.value && (
                                                            <InputAdornment position="end">
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() => sendOtp(field.value)}
                                                                    disabled={!field.value || field.value.length < 3}
                                                                >
                                                                    Send OTP
                                                                </Button>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                {field.value && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                        Email will be: {field.value}@samsung.com
                                                    </Typography>
                                                )}

                                                {/* OTP Field - appears in same column below Knox ID */}
                                                {isOtpSent && (
                                                    <Field name="otp">
                                                        {({ field: otpField }) => (
                                                            <TextField
                                                                {...otpField}
                                                                fullWidth
                                                                label="Enter OTP"
                                                                type="text"
                                                                margin="normal"
                                                                error={touched.otp && !!errors.otp}
                                                                helperText={touched.otp && errors.otp || (isOtpVerified ? 'OTP verified successfully!' : 'OTP sent to your Samsung email')}
                                                                inputProps={{ maxLength: 6 }}
                                                                disabled={isOtpVerified}
                                                                color={isOtpVerified ? 'success' : 'primary'}
                                                                onChange={(e) => {
                                                                    otpField.onChange(e);
                                                                    // Auto-verify when 6 digits are entered
                                                                    if (e.target.value.length === 6 && !isOtpVerified) {
                                                                        verifyOtp(e.target.value);
                                                                    }
                                                                }}
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <Security color={isOtpVerified ? 'success' : 'action'} />
                                                                        </InputAdornment>
                                                                    ),
                                                                    endAdornment: isOtpVerified && (
                                                                        <InputAdornment position="end">
                                                                            <Box sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                                                                                ✓ Verified
                                                                            </Box>
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                        )}
                                                    </Field>
                                                )}
                                            </Box>
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
                                                disabled={!isOtpVerified}
                                                error={touched.password && !!errors.password}
                                                helperText={touched.password && errors.password || (!isOtpVerified ? 'Verify Knox ID first to set password' : '')}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={togglePasswordVisibility}
                                                                edge="end"
                                                                disabled={!isOtpVerified}
                                                            >
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        )}
                                    </Field>

                                    <Field name="confirmPassword">
                                        {({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="Confirm Password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                margin="normal"
                                                disabled={!isOtpVerified}
                                                error={touched.confirmPassword && !!errors.confirmPassword}
                                                helperText={touched.confirmPassword && errors.confirmPassword || (!isOtpVerified ? 'Verify Knox ID first to confirm password' : '')}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={toggleConfirmPasswordVisibility}
                                                                edge="end"
                                                                disabled={!isOtpVerified}
                                                            >
                                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        )}
                                    </Field>

                                    <Field name="team">
                                        {({ field }) => (
                                            <FormControl
                                                fullWidth
                                                margin="normal"
                                                error={touched.team && !!errors.team}
                                                disabled={!isOtpVerified}
                                            >
                                                <InputLabel>Team</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Team"
                                                    disabled={!isOtpVerified}
                                                >
                                                    {teams.map((team) => (
                                                        <MenuItem key={team} value={team}>
                                                            {team}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {touched.team && errors.team && (
                                                    <FormHelperText>{errors.team}</FormHelperText>
                                                )}
                                                {!isOtpVerified && (
                                                    <FormHelperText>Verify Knox ID first to select team</FormHelperText>
                                                )}
                                            </FormControl>
                                        )}
                                    </Field>

                                    <Field name="role">
                                        {({ field }) => (
                                            <FormControl
                                                fullWidth
                                                margin="normal"
                                                error={touched.role && !!errors.role}
                                                disabled={!isOtpVerified}
                                            >
                                                <InputLabel>Role</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Role"
                                                    disabled={!isOtpVerified}
                                                >
                                                    {Object.values(USER_ROLES).map((role) => (
                                                        <MenuItem key={role} value={role}>
                                                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                                                {role}
                                                            </Typography>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {touched.role && errors.role && (
                                                    <FormHelperText>{errors.role}</FormHelperText>
                                                )}
                                                {!isOtpVerified && (
                                                    <FormHelperText>Verify Knox ID first to select role</FormHelperText>
                                                )}
                                            </FormControl>
                                        )}
                                    </Field>
                                </Box>

                                {/* Role Description */}
                                {values.role && (
                                    <Box sx={{ mt: 2, mb: 2 }}>
                                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                                            <Typography variant="body2">
                                                <strong>{values.role.charAt(0).toUpperCase() + values.role.slice(1)} Role:</strong>{' '}
                                                {roleDescriptions[values.role]}
                                            </Typography>
                                        </Alert>
                                    </Box>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={isSubmitting || !isOtpVerified}
                                    sx={{
                                        mt: 3,
                                        mb: 2,
                                        py: 1.5,
                                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                        },
                                        '&.Mui-disabled': {
                                            background: 'rgba(0, 0, 0, 0.12)',
                                        },
                                    }}
                                >
                                    {isSubmitting ? 'Creating Account...' : !isOtpVerified ? 'Verify Knox ID to Continue' : 'Create Account'}
                                </Button>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2">
                                        Already have an account?{' '}
                                        <Link
                                            to="/login"
                                            style={{
                                                color: '#1976d2',
                                                textDecoration: 'none',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Sign in here
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

export default Signup; 