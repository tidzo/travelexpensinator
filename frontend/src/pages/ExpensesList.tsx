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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { Add, Edit, Delete, AttachFile } from '@mui/icons-material';
import { ExpenseItem, Trip, Journey, Leg, Location } from '../types';
import { api } from '../services/api';

function ExpensesList() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [newExpense, setNewExpense] = useState({
    category_id: 1, // Default to first category
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount_gbp: '',
    is_billable: true,
    trip_id: undefined as number | undefined,
    journey_id: undefined as number | undefined,
    leg_id: undefined as number | undefined
  });

  const loadData = async () => {
    try {
      const [expensesData, tripsData, journeysData, legsData, locationsData] = await Promise.all([
        api.get<ExpenseItem[]>(`/expenses?month=${filterMonth}&year=${filterYear}`),
        api.get<Trip[]>('/trips'),
        api.get<Journey[]>('/journeys'),
        api.get<Leg[]>('/legs'),
        api.get<Location[]>('/locations')
      ]);
      setExpenses(expensesData);
      setTrips(tripsData);
      setJourneys(journeysData);
      setLegs(legsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear]);

  const deleteExpense = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${expenseId}`);
        setExpenses(expenses.filter(expense => expense.id !== expenseId));
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBillableChipColor = (isBillable: boolean) => {
    return isBillable ? 'success' : 'warning';
  };

  const handleCreateExpense = async () => {
    try {
      if (editingExpense) {
        // Update existing expense
        const updatedExpense = await api.put<ExpenseItem>(`/expenses/${editingExpense.id}`, {
          category_id: newExpense.category_id,
          date: newExpense.date,
          description: newExpense.description,
          amount_gbp: parseFloat(newExpense.amount_gbp),
          is_billable: newExpense.is_billable
        });
        setExpenses(expenses.map(expense =>
          expense.id === editingExpense.id ? updatedExpense : expense
        ));
      } else {
        // Create new expense
        const expense = await api.post<ExpenseItem>('/expenses', {
          ...newExpense,
          amount_gbp: parseFloat(newExpense.amount_gbp)
        });
        setExpenses([...expenses, expense]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setNewExpense({
      category_id: expense.category_id,
      date: expense.date,
      description: expense.description,
      amount_gbp: expense.amount_gbp.toString(),
      is_billable: expense.is_billable,
      trip_id: expense.trip_id,
      journey_id: expense.journey_id,
      leg_id: expense.leg_id
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    setNewExpense({
      category_id: 1,
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount_gbp: '',
      is_billable: true,
      trip_id: undefined,
      journey_id: undefined,
      leg_id: undefined
    });
  };

  if (loading) {
    return <Typography>Loading expenses...</Typography>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Expenses
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={filterMonth}
            label="Month"
            onChange={(e) => setFilterMonth(e.target.value as number)}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('en-GB', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={filterYear}
            label="Year"
            onChange={(e) => setFilterYear(e.target.value as number)}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <MenuItem key={i} value={new Date().getFullYear() - 2 + i}>
                {new Date().getFullYear() - 2 + i}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {expenses.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No expenses for {new Date(0, filterMonth - 1).toLocaleString('en-GB', { month: 'long' })} {filterYear}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Add your first expense to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {expenses.map((expense) => (
            <Card key={expense.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="attach" sx={{ mr: 1 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        {expense.description}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(expense.amount_gbp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(expense.date)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={expense.is_billable ? 'Billable' : 'Non-billable'}
                          size="small"
                          color={getBillableChipColor(expense.is_billable)}
                        />
                        {expense.vat_amount > 0 && (
                          <Chip
                            label={`VAT: ${formatCurrency(expense.vat_amount)}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
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
        aria-label="add expense"
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
        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Amount (GBP)"
            type="number"
            step="0.01"
            fullWidth
            variant="outlined"
            value={newExpense.amount_gbp}
            onChange={(e) => setNewExpense({ ...newExpense, amount_gbp: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Trip (Optional)</InputLabel>
            <Select
              value={newExpense.trip_id || ''}
              onChange={(e) => {
                const value = e.target.value;
                const tripId = value === '' ? undefined : Number(value);
                setNewExpense({
                  ...newExpense,
                  trip_id: tripId,
                  journey_id: undefined,
                  leg_id: undefined
                });
              }}
              label="Trip (Optional)"
            >
              <MenuItem value="">None</MenuItem>
              {trips.map((trip) => (
                <MenuItem key={trip.id} value={trip.id}>
                  Trip {trip.id} ({trip.start_date} - {trip.end_date})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {newExpense.trip_id && (
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Journey (Optional)</InputLabel>
              <Select
                value={newExpense.journey_id || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const journeyId = value === '' ? undefined : Number(value);
                  setNewExpense({
                    ...newExpense,
                    journey_id: journeyId,
                    leg_id: undefined
                  });
                }}
                label="Journey (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {journeys
                  .filter(journey => journey.trip_id === newExpense.trip_id)
                  .map((journey) => (
                    <MenuItem key={journey.id} value={journey.id}>
                      {journey.date} - {journey.description || 'Journey'}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          {newExpense.journey_id && (
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Transport Leg (Optional)</InputLabel>
              <Select
                value={newExpense.leg_id || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewExpense({ ...newExpense, leg_id: value === '' ? undefined : Number(value) });
                }}
                label="Transport Leg (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {legs
                  .filter(leg => leg.journey_id === newExpense.journey_id)
                  .map((leg) => {
                    const originLocation = locations.find(loc => loc.id === leg.origin_location_id);
                    const destLocation = locations.find(loc => loc.id === leg.destination_location_id);
                    const originName = originLocation?.name || `Location ${leg.origin_location_id}`;
                    const destName = destLocation?.name || `Location ${leg.destination_location_id}`;
                    return (
                      <MenuItem key={leg.id} value={leg.id}>
                        {leg.mode_of_transport}: {originName} → {destName}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Billable</InputLabel>
            <Select
              value={newExpense.is_billable}
              onChange={(e) => setNewExpense({ ...newExpense, is_billable: e.target.value as boolean })}
              label="Billable"
            >
              <MenuItem value={true}>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateExpense}
            variant="contained"
            disabled={!newExpense.description || !newExpense.amount_gbp}
          >
            {editingExpense ? 'Update Expense' : 'Create Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExpensesList;