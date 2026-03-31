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
import { ExpenseItem } from '../types';
import { api } from '../services/api';

function ExpensesList() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
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
    is_billable: true
  });

  const loadExpenses = async () => {
    try {
      const data = await api.get<ExpenseItem[]>(`/expenses?month=${filterMonth}&year=${filterYear}`);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
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
          ...newExpense,
          amount_gbp: parseFloat(newExpense.amount_gbp)
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
      is_billable: expense.is_billable
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
      is_billable: true
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