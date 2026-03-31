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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { Trip } from '../types';
import { api } from '../services/api';

function TripsList() {
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [newTrip, setNewTrip] = useState({
    start_date: '',
    end_date: '',
    notes: ''
  });

  const loadTrips = async () => {
    try {
      const data = await api.get<Trip[]>('/trips');
      setAllTrips(data);
      filterTripsForThreeMonths(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTripsForThreeMonths = (trips: Trip[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get previous, current, and next month dates
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    const nextMonth = new Date(currentYear, currentMonth + 2, 0); // Last day of next month

    const filtered = trips.filter(trip => {
      const tripStart = new Date(trip.start_date);
      return tripStart >= prevMonth && tripStart <= nextMonth;
    });

    setFilteredTrips(filtered);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const deleteTrip = async (tripId: number) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.delete(`/trips/${tripId}`);
        const updatedTrips = allTrips.filter(trip => trip.id !== tripId);
        setAllTrips(updatedTrips);
        filterTripsForThreeMonths(updatedTrips);
      } catch (error) {
        console.error('Failed to delete trip:', error);
      }
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDateWithDay = (date: Date) => {
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
      const isoDate = date.toISOString().split('T')[0];
      return `${dayName} ${isoDate}`;
    };

    return `${formatDateWithDay(start)} - ${formatDateWithDay(end)}`;
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return nights === 1 ? '1 night' : `${nights} nights`;
  };

  const handleCreateTrip = async () => {
    try {
      if (editingTrip) {
        // Update existing trip
        const updatedTrip = await api.put<Trip>(`/trips/${editingTrip.id}`, newTrip);
        const updatedTrips = allTrips.map(trip =>
          trip.id === editingTrip.id ? updatedTrip : trip
        );
        setAllTrips(updatedTrips);
        filterTripsForThreeMonths(updatedTrips);
      } else {
        // Create new trip
        const trip = await api.post<Trip>('/trips', newTrip);
        const updatedTrips = [...allTrips, trip];
        setAllTrips(updatedTrips);
        filterTripsForThreeMonths(updatedTrips);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save trip:', error);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setNewTrip({
      start_date: trip.start_date,
      end_date: trip.end_date,
      notes: trip.notes || ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTrip(null);
    setNewTrip({ start_date: '', end_date: '', notes: '' });
  };

  if (loading) {
    return <Typography>Loading trips...</Typography>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        My Trips
      </Typography>

      {filteredTrips.length === 0 ? (
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
          {filteredTrips.map((trip) => (
            <Card key={trip.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditTrip(trip)}
                      sx={{ mr: 1 }}
                    >
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
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTrip ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
            value={newTrip.start_date}
            onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            variant="outlined"
            value={newTrip.end_date}
            onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTrip.notes}
            onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateTrip}
            variant="contained"
            disabled={!newTrip.start_date || !newTrip.end_date}
          >
            {editingTrip ? 'Update Trip' : 'Create Trip'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TripsList;