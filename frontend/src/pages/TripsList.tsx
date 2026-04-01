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
import { Add, Edit, Delete, DirectionsTransit, Receipt } from '@mui/icons-material';
import { Trip, ExpenseCategory } from '../types';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useDateContext } from '../contexts/DateContext';
import ExpenseDialog from '../components/ExpenseDialog';

function TripsList() {
  const navigate = useNavigate();
  const { selectedMonth, selectedYear } = useDateContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [newTrip, setNewTrip] = useState({
    start_date: '',
    end_date: '',
    notes: ''
  });
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const loadData = async () => {
    try {
      const [tripsData, categoriesData] = await Promise.all([
        api.get<Trip[]>(`/trips?month=${selectedMonth}&year=${selectedYear}`),
        api.get<ExpenseCategory[]>('/expense-categories')
      ]);
      setTrips(tripsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

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

  const formatTripName = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startDayShort = start.toLocaleDateString('en-GB', { weekday: 'short' });
    const endDayShort = end.toLocaleDateString('en-GB', { weekday: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const monthName = start.toLocaleDateString('en-GB', { month: 'long' });

    return `Trip: ${startDayShort} ${startDay} - ${endDayShort} ${endDay} ${monthName}`;
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

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('en-GB', { month: 'long' });
  };

  const handleCreateTrip = async () => {
    try {
      if (editingTrip) {
        // Update existing trip
        const updatedTrip = await api.put<Trip>(`/trips/${editingTrip.id}`, newTrip);
        setTrips(trips.map(trip =>
          trip.id === editingTrip.id ? updatedTrip : trip
        ));
      } else {
        // Create new trip
        const trip = await api.post<Trip>('/trips', newTrip);
        setTrips([...trips, trip]);
      }
      handleCloseDialog();
      // Refresh the list to ensure we have the latest data
      loadData();
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
        Trips in {getMonthName(selectedMonth)} {selectedYear}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DirectionsTransit />}
          onClick={() => setDialogOpen(true)}
        >
          Add Trip
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Receipt />}
          onClick={() => setExpenseDialogOpen(true)}
        >
          Add other expense
        </Button>
      </Box>

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
                onClick={() => navigate(`/trips/${trip.id}`)}
                sx={{ cursor: 'pointer' }}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTrip(trip);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrip(trip.id);
                      }}
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
                        {formatTripName(trip.start_date, trip.end_date)}
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

      <ExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        categories={categories}
        onSave={() => {
          setExpenseDialogOpen(false);
          // Expenses are not displayed on this page, so no need to refresh
        }}
      />
    </Box>
  );
}

export default TripsList;