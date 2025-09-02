import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            bgcolor="background.default"
        >
            <CircularProgress size={60} thickness={4} />
            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 2 }}
            >
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingSpinner; 