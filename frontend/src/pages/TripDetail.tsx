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
  Restaurant,
  Hotel,
  AttachFile,
  Link,
  AttachmentOutlined,
} from '@mui/icons-material';
import { Trip, Journey, Leg, Location, ExpenseCategory, ExpenseItem, EvidenceItem } from '../types';
import { api } from '../services/api';
import LegsList from '../components/LegsList';
import ExpenseDialog from '../components/ExpenseDialog';

function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
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
    type: 'trip';
    id: number;
    date: string;
    categoryId?: number;
  } | null>(null);
  const [linkEvidenceDialogOpen, setLinkEvidenceDialogOpen] = useState(false);
  const [linkingExpenseId, setLinkingExpenseId] = useState<number | null>(null);
  const [availableEvidence, setAvailableEvidence] = useState<EvidenceItem[]>([]);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedExpenseEvidence, setSelectedExpenseEvidence] = useState<EvidenceItem[]>([]);

  const loadData = async () => {
    try {
      const [tripData, journeysData, expensesData, locationsData, categoriesData] = await Promise.all([
        api.get<Trip>(`/trips/${tripId}`),
        api.get<Journey[]>(`/journeys?trip_id=${tripId}`),
        api.get<ExpenseItem[]>(`/expenses?trip_id=${tripId}`),
        api.get<Location[]>('/locations'),
        api.get<ExpenseCategory[]>('/expense-categories')
      ]);
      setTrip(tripData);
      setJourneys(journeysData);
      setExpenses(expensesData);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
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

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('subsistence')) {
      return <Restaurant fontSize="small" sx={{ mr: 1, color: 'action.active' }} />;
    } else if (name.includes('accommodation') || name.includes('incidental')) {
      return <Hotel fontSize="small" sx={{ mr: 1, color: 'action.active' }} />;
    } else if (name.includes('travel')) {
      return <DirectionsTransit fontSize="small" sx={{ mr: 1, color: 'action.active' }} />;
    }
    return null;
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

  const handleFileUpload = async (expenseId: number) => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf';
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_date', new Date().toISOString().split('T')[0]);
          formData.append('description', `Evidence for expense ${expenseId}`);

          const evidence = await api.uploadFile('/files/upload', formData);

          await api.post('/expense-evidence-links', {
            expense_item_id: expenseId,
            evidence_item_id: evidence.id
          });

          loadData(); // Refresh data
        } catch (error) {
          console.error('Failed to upload file:', error);
          alert('Failed to upload file');
        }
      }
    };
    fileInput.click();
  };

  const handleLinkExistingEvidence = async (expenseId: number) => {
    try {
      // Get all available evidence items
      const allEvidence = await api.get<EvidenceItem[]>('/files');
      // Get evidence already linked to this expense
      const linkedEvidence = await api.get<EvidenceItem[]>(`/expenses/${expenseId}/evidence`);

      // Filter out evidence that's already linked to this expense
      const linkedIds = new Set(linkedEvidence.map(e => e.id));
      const available = allEvidence.filter(e => !linkedIds.has(e.id));

      setAvailableEvidence(available);
      setLinkingExpenseId(expenseId);
      setLinkEvidenceDialogOpen(true);
    } catch (error) {
      console.error('Failed to load evidence:', error);
      alert('Failed to load evidence items.');
    }
  };

  const handleLinkEvidenceToExpense = async (evidenceId: number) => {
    if (!linkingExpenseId) return;

    try {
      await api.post('/expense-evidence-links', {
        expense_item_id: linkingExpenseId,
        evidence_item_id: evidenceId
      });

      // Refresh the data to update evidence counts
      loadData();
      setLinkEvidenceDialogOpen(false);
      setLinkingExpenseId(null);
      setAvailableEvidence([]);
    } catch (error) {
      console.error('Failed to link evidence:', error);
      alert('Failed to link evidence to expense.');
    }
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const deleteExpense = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${expenseId}`);
        loadData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const handleViewEvidence = async (expenseId: number) => {
    try {
      // Get evidence items for this expense
      const evidence = await api.get<EvidenceItem[]>(`/expenses/${expenseId}/evidence`);
      setSelectedExpenseEvidence(evidence);
      setEvidenceDialogOpen(true);
    } catch (error) {
      console.error('Failed to load evidence:', error);
      alert('Failed to load evidence items.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        <IconButton onClick={() => navigate('/expenses')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {formatTripName(trip.start_date, trip.end_date)}
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DirectionsTransit />}
              onClick={() => setJourneyDialogOpen(true)}
            >
              Add Journey
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Receipt />}
              onClick={handleCreateExpenseFromTrip}
            >
              Add Trip Expense
            </Button>
          </Box>
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

      <Typography variant="h5" component="h2" sx={{ mb: 2, mt: 3 }}>
        Trip Expenses
      </Typography>

      {(() => {
        // Filter out expenses that are linked to journeys or legs
        const tripOnlyExpenses = expenses.filter(expense =>
          !expense.journey_id && !expense.leg_id
        );

        return tripOnlyExpenses.length === 0 ? (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" textAlign="center">
                No trip expenses yet
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Trip expenses (not linked to journeys) will appear here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <List>
                {tripOnlyExpenses
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((expense) => (
                  <ListItem
                    key={expense.id}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          aria-label="attach"
                          sx={{ mr: 1 }}
                          onClick={() => handleFileUpload(expense.id)}
                          title="Upload new evidence"
                        >
                          <AttachFile />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="link-evidence"
                          sx={{ mr: 1 }}
                          onClick={() => handleLinkExistingEvidence(expense.id)}
                          title="Link existing evidence"
                        >
                          <Link />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditExpense(expense)}
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getCategoryIcon(categories.find(c => c.id === expense.category_id)?.name || '')}
                          <Box>
                            <Typography variant="body1">
                              {expense.description}
                            </Typography>
                            {expense.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                {expense.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateWithDay(expense.date.toString())} • £{Number(expense.amount_gbp).toFixed(2)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={categories.find(c => c.id === expense.category_id)?.name || 'Unknown Category'}
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                            {Number(expense.vat_amount) > 0 && (
                              <Chip
                                label={`VAT: ${formatCurrency(Number(expense.vat_amount))}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {expense.evidence_count > 0 && (
                              <Chip
                                icon={<AttachmentOutlined />}
                                label={`${expense.evidence_count} evidence`}
                                size="small"
                                color="info"
                                variant="outlined"
                                onClick={() => handleViewEvidence(expense.id)}
                                sx={{ cursor: 'pointer' }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        );
      })()}

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
        onClose={() => {
          setExpenseDialogOpen(false);
          setEditingExpense(null);
          setExpenseParentContext(null);
        }}
        categories={categories}
        editingExpense={editingExpense}
        initialData={expenseParentContext ? {
          date: expenseParentContext.date,
          categoryId: expenseParentContext.categoryId,
          tripId: expenseParentContext.id
        } : undefined}
        onExpenseCreated={() => {
          loadData(); // Reload all data to show the new expense
          setEditingExpense(null);
        }}
      />

      {/* Link evidence dialog */}
      <Dialog
        open={linkEvidenceDialogOpen}
        onClose={() => {
          setLinkEvidenceDialogOpen(false);
          setLinkingExpenseId(null);
          setAvailableEvidence([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link Existing Evidence</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select evidence to link to this expense:
          </Typography>
          {availableEvidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No available evidence items to link.
            </Typography>
          ) : (
            <List>
              {availableEvidence.map((evidence) => (
                <ListItem
                  key={evidence.id}
                  button
                  onClick={() => handleLinkEvidenceToExpense(evidence.id)}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={evidence.original_filename}
                    secondary={`Uploaded: ${new Date(evidence.upload_date).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setLinkEvidenceDialogOpen(false);
            setLinkingExpenseId(null);
            setAvailableEvidence([]);
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Evidence viewing dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={() => setEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Trip Expense Evidence</DialogTitle>
        <DialogContent>
          {selectedExpenseEvidence.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No evidence items found for this expense.
            </Typography>
          ) : (
            <List>
              {selectedExpenseEvidence.map((evidence) => (
                <Card key={evidence.id} sx={{ mb: 2 }}>
                  <ListItem>
                    <ListItemText
                      primary={evidence.original_filename}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {evidence.description && `${evidence.description} • `}
                            Uploaded: {formatDate(evidence.upload_date)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Type: {evidence.file_type}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.open(`/uploads/${evidence.file_path}`, '_blank')}
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                    </Box>
                  </ListItem>
                </Card>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvidenceDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TripDetail;