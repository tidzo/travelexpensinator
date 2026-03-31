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
} from '@mui/material';
import { Add, Edit, Delete, AttachFile } from '@mui/icons-material';
import { ExpenseItem } from '../types';
import { api } from '../services/api';

function ExpensesList() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

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
                    <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }}>
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

export default ExpensesList;