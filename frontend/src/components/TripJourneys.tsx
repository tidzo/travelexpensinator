import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  ExpandMore,
  Today,
  Edit,
  Delete,
} from '@mui/icons-material';
import { Journey, Location, ExpenseCategory } from '../types';
import { formatDateWithDay } from '../utils/formatters';
import { api } from '../services/api';
import LegsList from './LegsList';

interface TripJourneysProps {
  journeys: Journey[];
  locations: Location[];
  categories: ExpenseCategory[];
  onJourneysChange: () => void;
}

function TripJourneys({ journeys, locations, categories, onJourneysChange }: TripJourneysProps) {
  const [journeyDialogOpen, setJourneyDialogOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [newJourney, setNewJourney] = useState({
    trip_id: journeys[0]?.trip_id || 0,
    date: '',
    description: ''
  });

  const handleCloseJourneyDialog = () => {
    setJourneyDialogOpen(false);
    setEditingJourney(null);
    setNewJourney({
      trip_id: journeys[0]?.trip_id || 0,
      date: '',
      description: ''
    });
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

  const handleCreateJourney = async () => {
    try {
      if (editingJourney) {
        await api.put<Journey>(`/journeys/${editingJourney.id}`, newJourney);
      } else {
        await api.post<Journey>('/journeys', newJourney);
      }
      handleCloseJourneyDialog();
      onJourneysChange();
    } catch (error) {
      console.error('Failed to save journey:', error);
    }
  };

  const deleteJourney = async (journeyId: number) => {
    if (window.confirm('Delete this journey and all its transport legs?')) {
      try {
        await api.delete(`/journeys/${journeyId}`);
        onJourneysChange();
      } catch (error) {
        console.error('Failed to delete journey:', error);
      }
    }
  };

  return (
    <>
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
          {journeys
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((journey) => (
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
                <LegsList
                  journeyId={journey.id}
                  locations={locations}
                  categories={categories}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Journey Dialog */}
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
    </>
  );
}

export default TripJourneys;
