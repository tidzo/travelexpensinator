import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ExpenseCategory, ExpenseItem } from '../types';
import { api } from '../services/api';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  editingExpense?: ExpenseItem | null;
  initialData?: {
    date: string;
    categoryId?: number;
    tripId?: number;
    journeyId?: number;
    legId?: number;
  };
  onExpenseCreated?: (expense: ExpenseItem) => void;
}

function ExpenseDialog({
  open,
  onClose,
  categories,
  editingExpense,
  initialData,
  onExpenseCreated
}: ExpenseDialogProps) {
  const [expense, setExpense] = useState({
    category_id: initialData?.categoryId || (categories[0]?.id || 1),
    date: initialData?.date || new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    amount_gbp: '',
    is_billable: true,
    trip_id: initialData?.tripId,
    journey_id: initialData?.journeyId,
    leg_id: initialData?.legId
  });

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        // Editing existing expense
        setExpense({
          category_id: editingExpense.category_id,
          date: editingExpense.date.toString(),
          description: editingExpense.description,
          notes: editingExpense.notes || '',
          amount_gbp: editingExpense.amount_gbp.toString(),
          is_billable: editingExpense.is_billable,
          trip_id: editingExpense.trip_id,
          journey_id: editingExpense.journey_id,
          leg_id: editingExpense.leg_id
        });
      } else if (initialData) {
        // Creating new expense
        setExpense(prev => ({
          ...prev,
          category_id: initialData.categoryId || (categories[0]?.id || 1),
          date: initialData.date,
          trip_id: initialData.tripId,
          journey_id: initialData.journeyId,
          leg_id: initialData.legId,
          description: '',
          notes: '',
          amount_gbp: ''
        }));
      }
    }
  }, [open, editingExpense, initialData, categories]);

  const handleSubmit = async () => {
    try {
      const expenseData = {
        ...expense,
        amount_gbp: parseFloat(expense.amount_gbp)
      };

      // Remove undefined values
      Object.keys(expenseData).forEach(key => {
        if (expenseData[key as keyof typeof expenseData] === undefined) {
          delete expenseData[key as keyof typeof expenseData];
        }
      });

      let savedExpense: ExpenseItem;
      if (editingExpense) {
        // Update existing expense
        savedExpense = await api.put<ExpenseItem>(`/expenses/${editingExpense.id}`, expenseData);
      } else {
        // Create new expense
        savedExpense = await api.post<ExpenseItem>('/expenses', expenseData);
      }

      if (onExpenseCreated) {
        onExpenseCreated(savedExpense);
      }

      handleClose();
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const handleClose = () => {
    setExpense({
      category_id: categories[0]?.id || 1,
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      amount_gbp: '',
      is_billable: true,
      trip_id: undefined,
      journey_id: undefined,
      leg_id: undefined
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Description"
          fullWidth
          variant="outlined"
          value={expense.description}
          onChange={(e) => setExpense({ ...expense, description: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Notes (Optional)"
          fullWidth
          variant="outlined"
          multiline
          rows={2}
          value={expense.notes}
          onChange={(e) => setExpense({ ...expense, notes: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Amount (GBP)"
          type="number"
          fullWidth
          variant="outlined"
          value={expense.amount_gbp}
          onChange={(e) => setExpense({ ...expense, amount_gbp: e.target.value })}
          inputProps={{ step: 0.01 }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={expense.category_id}
            onChange={(e) => setExpense({ ...expense, category_id: Number(e.target.value) })}
            label="Category"
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name} ({category.vat_status})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          label="Date"
          type="date"
          fullWidth
          variant="outlined"
          value={expense.date}
          onChange={(e) => setExpense({ ...expense, date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
          <InputLabel>Billable</InputLabel>
          <Select
            value={expense.is_billable.toString()}
            onChange={(e) => setExpense({ ...expense, is_billable: e.target.value === 'true' })}
            label="Billable"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!expense.description || !expense.amount_gbp}
        >
          {editingExpense ? 'Update Expense' : 'Create Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExpenseDialog;