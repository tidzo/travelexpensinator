import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ArrowBack,
  DirectionsTransit,
  Today,
  Receipt,
} from '@mui/icons-material';
import { Trip, Journey, Leg, Location, ExpenseCategory } from '../types';
import { api } from '../services/api';
import LegsList from '../components/LegsList';
import ExpenseDialog from '../components/ExpenseDialog';

function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [journeyDialogOpen, setJourneyDialogOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [newJourney, setNewJourney] = useState({
    trip_id: parseInt(tripId || '0'),
    date: '',
    description: ''
  });
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseParentContext, setExpenseParentContext] = useState<{
    type: 'trip' | 'journey';
    id: number;
    date: string;
    categoryId?: number;
  } | null>(null);

  const loadData = async () => {
    try {
      const [tripData, journeysData, locationsData, categoriesData] = await Promise.all([
        api.get<Trip>(`/trips/${tripId}`),
        api.get<Journey[]>(`/journeys?trip_id=${tripId}`),
        api.get<Location[]>('/locations'),
        api.get<ExpenseCategory[]>('/expense-categories')
      ]);
      setTrip(tripData);
      setJourneys(journeysData);
      setLocations(locationsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      loadData();
    }
  }, [tripId]);

  const handleCreateJourney = async () => {
    try {
      if (editingJourney) {
        const updatedJourney = await api.put<Journey>(`/journeys/${editingJourney.id}`, newJourney);
        setJourneys(journeys.map(journey =>
          journey.id === editingJourney.id ? updatedJourney : journey
        ));
      } else {
        const journey = await api.post<Journey>('/journeys', newJourney);
        setJourneys([...journeys, journey]);
      }
      handleCloseJourneyDialog();
    } catch (error) {
      console.error('Failed to save journey:', error);
    }
  };

  const handleEditJourney = (journey: Journey) => {
    setEditingJourney(journey);
    setNewJourney({
      trip_id: journey.trip_id,
      date: journey.date,
      description: journey.description || ''
    });
    setJourneyDialogOpen(true);
  };

  const handleCloseJourneyDialog = () => {
    setJourneyDialogOpen(false);
    setEditingJourney(null);
    setNewJourney({ trip_id: parseInt(tripId || '0'), date: '', description: '' });
  };

  const deleteJourney = async (journeyId: number) => {
    if (window.confirm('Are you sure you want to delete this journey?')) {
      try {
        await api.delete(`/journeys/${journeyId}`);
        setJourneys(journeys.filter(journey => journey.id !== journeyId));
      } catch (error) {
        console.error('Failed to delete journey:', error);
      }
    }
  };

  const formatDateWithDay = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
    const isoDate = date.toISOString().split('T')[0];
    return `${dayName} ${isoDate}`;
  };

  const handleCreateExpenseFromTrip = () => {
    if (!trip) return;
    setExpenseParentContext({
      type: 'trip',
      id: trip.id,
      date: trip.start_date
    });
    setExpenseDialogOpen(true);
  };

  const handleCreateExpenseFromJourney = (journey: Journey) => {
    const travelCategory = categories.find(cat => cat.name === 'Travel');
    setExpenseParentContext({
      type: 'journey',
      id: journey.id,
      date: journey.date,
      categoryId: travelCategory?.id
    });
    setExpenseDialogOpen(true);
  };


  if (loading) {
    return <Typography>Loading trip details...</Typography>;
  }

  if (!trip) {
    return <Typography>Trip not found</Typography>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/trips')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Trip {trip.id}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {formatDateWithDay(trip.start_date)} - {formatDateWithDay(trip.end_date)}
          </Typography>
          {trip.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {trip.notes}
            </Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Receipt />}
            onClick={handleCreateExpenseFromTrip}
          >
            Add Trip Expense
          </Button>
        </CardContent>
      </Card>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Journeys
      </Typography>

      {journeys.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No journeys yet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Add your first journey to this trip
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {journeys.map((journey) => (
            <Accordion key={journey.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Today sx={{ mr: 2, color: 'action.active' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {formatDateWithDay(journey.date)}
                    </Typography>
                    {journey.description && (
                      <Typography variant="body2" color="text.secondary">
                        {journey.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditJourney(journey);
                      }}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteJourney(journey.id);
                      }}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Receipt />}
                  onClick={() => handleCreateExpenseFromJourney(journey)}
                  sx={{ mb: 2 }}
                >
                  Add Journey Expense
                </Button>
                <LegsList
                  journeyId={journey.id}
                  locations={locations}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add journey"
        onClick={() => setJourneyDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>

      <Dialog open={journeyDialogOpen} onClose={handleCloseJourneyDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingJourney ? 'Edit Journey' : 'Add New Journey'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={newJourney.date}
            onChange={(e) => setNewJourney({ ...newJourney, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newJourney.description}
            onChange={(e) => setNewJourney({ ...newJourney, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJourneyDialog}>Cancel</Button>
          <Button
            onClick={handleCreateJourney}
            variant="contained"
            disabled={!newJourney.date}
          >
            {editingJourney ? 'Update Journey' : 'Create Journey'}
          </Button>
        </DialogActions>
      </Dialog>

      <ExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        categories={categories}
        initialData={expenseParentContext ? {
          date: expenseParentContext.date,
          categoryId: expenseParentContext.categoryId,
          tripId: expenseParentContext.type === 'trip' ? expenseParentContext.id : trip?.id,
          journeyId: expenseParentContext.type === 'journey' ? expenseParentContext.id : undefined
        } : undefined}
        onExpenseCreated={() => {
          // Could reload trip data or show a success message
          console.log('Expense created successfully');
        }}
      />
    </Box>
  );
}

export default TripDetail;