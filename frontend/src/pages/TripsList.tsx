import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Fab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { Trip } from '../types';
import { api } from '../services/api';

function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    try {
      const data = await api.get<Trip[]>('/trips');
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const deleteTrip = async (tripId: number) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.delete(`/trips/${tripId}`);
        setTrips(trips.filter(trip => trip.id !== tripId));
      } catch (error) {
        console.error('Failed to delete trip:', error);
      }
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return nights === 1 ? '1 night' : `${nights} nights`;
  };

  if (loading) {
    return <Typography>Loading trips...</Typography>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        My Trips
      </Typography>

      {trips.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No trips yet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Add your first business trip to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {trips.map((trip) => (
            <Card key={trip.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }}>
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteTrip(trip.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        Trip {trip.id}
                      </Typography>
                      <Chip
                        label={getDuration(trip.start_date, trip.end_date)}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateRange(trip.start_date, trip.end_date)}
                      </Typography>
                      {trip.notes && (
                        <Typography variant="body2" color="text.secondary">
                          {trip.notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add trip"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
}

export default TripsList;