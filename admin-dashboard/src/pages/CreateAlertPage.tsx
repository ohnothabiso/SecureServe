import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface AlertFormData {
  title: string;
  description: string;
  category: string;
  radiusKm: number;
  lastSeenLat: number;
  lastSeenLng: number;
}

const CreateAlertPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<AlertFormData>({
    defaultValues: {
      title: '',
      description: '',
      category: 'missing_person',
      radiusKm: 50,
      lastSeenLat: -26.2041, // Johannesburg default
      lastSeenLng: 28.0473,
    }
  });

  const onSubmit = async (data: AlertFormData) => {
    setLoading(true);
    setError('');

    try {
      const alertData = {
        alertId: `alert_${Date.now()}`,
        title: data.title,
        description: data.description,
        category: data.category,
        lastSeen: {
          lat: data.lastSeenLat,
          lng: data.lastSeenLng,
        },
        radiusKm: data.radiusKm,
        createdBy: 'admin', // This would be the actual admin user ID
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        active: true,
      };

      await addDoc(collection(db, 'alerts'), alertData);
      navigate('/alerts');
    } catch (err: any) {
      setError(err.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Alert
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Alert Title"
                    placeholder="e.g., Missing child — Sipho Nkosi"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    placeholder="Provide detailed description including age, clothing, last seen details, etc."
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select {...field}>
                      <MenuItem value="missing_person">Missing Person</MenuItem>
                      <MenuItem value="stolen_vehicle">Stolen Vehicle</MenuItem>
                      <MenuItem value="missing_elderly">Missing Elderly</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="radiusKm"
                control={control}
                rules={{ 
                  required: 'Radius is required',
                  min: { value: 1, message: 'Radius must be at least 1 km' },
                  max: { value: 200, message: 'Radius cannot exceed 200 km' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Notification Radius (km)"
                    error={!!errors.radiusKm}
                    helperText={errors.radiusKm?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="lastSeenLat"
                control={control}
                rules={{ 
                  required: 'Latitude is required',
                  min: { value: -35, message: 'Invalid latitude' },
                  max: { value: -22, message: 'Invalid latitude' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Last Seen Latitude"
                    placeholder="-26.2041"
                    error={!!errors.lastSeenLat}
                    helperText={errors.lastSeenLat?.message || 'South African latitude range: -22 to -35'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="lastSeenLng"
                control={control}
                rules={{ 
                  required: 'Longitude is required',
                  min: { value: 16, message: 'Invalid longitude' },
                  max: { value: 33, message: 'Invalid longitude' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Last Seen Longitude"
                    placeholder="28.0473"
                    error={!!errors.lastSeenLng}
                    helperText={errors.lastSeenLng?.message || 'South African longitude range: 16 to 33'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Note:</strong> For the hackathon demo, you can use these sample coordinates:
                  <br />
                  • Johannesburg (Sandton): -26.1076, 28.0567
                  <br />
                  • Cape Town (Observatory): -33.9258, 18.4232
                  <br />
                  • Pretoria (Hatfield): -25.7479, 28.2293
                </Typography>
              </Alert>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Alert'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/alerts')}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateAlertPage;