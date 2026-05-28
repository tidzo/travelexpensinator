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
import { Add, Edit, Delete, DirectionsTransit, Receipt, AttachFile } from '@mui/icons-material';
import { Trip, ExpenseCategory, ExpenseItem, EvidenceItem } from '../types';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useDateContext } from '../contexts/DateContext';
import ExpenseDialog from '../components/ExpenseDialog';
import { formatTripName, formatDateRange } from '../utils/formatters';

function TripsList() {
  const navigate = useNavigate();
  const { selectedMonth, selectedYear } = useDateContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
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
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem[]>([]);

  const loadData = async () => {
    try {
      const [tripsData, expensesData, categoriesData] = await Promise.all([
        api.get<Trip[]>(`/trips?month=${selectedMonth}&year=${selectedYear}`),
        api.get<ExpenseItem[]>(`/expenses?month=${selectedMonth}&year=${selectedYear}`),
        api.get<ExpenseCategory[]>('/expense-categories')
      ]);
      setTrips(tripsData);
      setExpenses(expensesData.filter(expense => !expense.trip_id)); // Only unlinked expenses
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

  const handleFileUpload = async (expenseId: number) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf';

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

  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleViewEvidence = async (expenseId: number) => {
    try {
      const evidence = await api.get<EvidenceItem[]>(`/expenses/${expenseId}/evidence`);
      setSelectedEvidence(evidence);
      setEvidenceDialogOpen(true);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    }
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

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.toLowerCase().includes('transport') ||
        categoryName.toLowerCase().includes('travel') ||
        categoryName.toLowerCase().includes('fuel') ||
        categoryName.toLowerCase().includes('parking') ||
        categoryName.toLowerCase().includes('taxi') ||
        categoryName.toLowerCase().includes('train') ||
        categoryName.toLowerCase().includes('flight')) {
      return <DirectionsTransit sx={{ mr: 2, color: 'text.secondary' }} />;
    }
    if (categoryName.toLowerCase().includes('meal') ||
        categoryName.toLowerCase().includes('food') ||
        categoryName.toLowerCase().includes('restaurant') ||
        categoryName.toLowerCase().includes('dining')) {
      return <Receipt sx={{ mr: 2, color: 'text.secondary' }} />;
    }
    return <Receipt sx={{ mr: 2, color: 'text.secondary' }} />;
  };

  if (loading) {
    return <Typography>Loading trips...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Expenses in {getMonthName(selectedMonth)} {selectedYear}
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
                onClick={() => navigate(`/expenses/trips/${trip.id}`)}
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

      {/* Other Expenses Section */}
      {expenses.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Other Expenses
            </Typography>
            <List>
              {expenses
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
                          {new Date(expense.date).toLocaleDateString()} • £{Number(expense.amount_gbp).toFixed(2)}
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
                              label={`VAT: £${Number(expense.vat_amount).toFixed(2)}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {expense.evidence_count && expense.evidence_count > 0 && (
                            <Chip
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
        onClose={() => {
          setExpenseDialogOpen(false);
          setEditingExpense(null);
        }}
        categories={categories}
        editingExpense={editingExpense}
        onExpenseCreated={() => {
          loadData();
        }}
      />

      <Dialog open={evidenceDialogOpen} onClose={() => setEvidenceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Evidence Items</DialogTitle>
        <DialogContent>
          {selectedEvidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No evidence items linked to this expense.</Typography>
          ) : (
            <List>
              {selectedEvidence.map((evidence) => {
                const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
                const fileUrl = `${apiBase}/uploads/${evidence.file_path}`;
                const isImage = evidence.file_type.startsWith('image/');
                return (
                  <ListItem key={evidence.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                    {isImage && (
                      <Box component="img" src={fileUrl} alt={evidence.original_filename} sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', mb: 1, borderRadius: 1 }} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <ListItemText primary={evidence.original_filename} secondary={`Uploaded: ${new Date(evidence.upload_date).toLocaleDateString()}`} />
                      <Button size="small" variant="outlined" href={fileUrl} target="_blank" rel="noopener noreferrer" sx={{ ml: 2, flexShrink: 0 }}>Open</Button>
                    </Box>
                  </ListItem>
                );
              })}
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

export default TripsList;