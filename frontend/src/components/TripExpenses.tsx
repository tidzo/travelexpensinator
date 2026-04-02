import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Chip,
} from '@mui/material';
import {
  Edit,
  Delete,
  AttachFile,
  Link,
  AttachmentOutlined,
  Restaurant,
  Hotel,
  DirectionsTransit,
} from '@mui/icons-material';
import { ExpenseItem, ExpenseCategory } from '../types';
import { formatCurrency, formatDateWithDay } from '../utils/formatters';
import { api } from '../services/api';

interface TripExpensesProps {
  expenses: ExpenseItem[];
  categories: ExpenseCategory[];
  onExpenseEdit: (expense: ExpenseItem) => void;
  onExpenseDeleted: () => void;
  onFileUpload: (expenseId: number) => void;
  onLinkEvidence: (expenseId: number) => void;
  onViewEvidence: (expenseId: number) => void;
}

function TripExpenses({
  expenses,
  categories,
  onExpenseEdit,
  onExpenseDeleted,
  onFileUpload,
  onLinkEvidence,
  onViewEvidence,
}: TripExpensesProps) {
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

  const handleDeleteExpense = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${expenseId}`);
        onExpenseDeleted();
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  // Filter out expenses that are linked to journeys or legs
  const tripOnlyExpenses = expenses.filter(expense =>
    !expense.journey_id && !expense.leg_id
  );

  if (tripOnlyExpenses.length === 0) {
    return (
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
    );
  }

  return (
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
                    onClick={() => onFileUpload(expense.id)}
                    title="Upload new evidence"
                  >
                    <AttachFile />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="link-evidence"
                    sx={{ mr: 1 }}
                    onClick={() => onLinkEvidence(expense.id)}
                    title="Link existing evidence"
                  >
                    <Link />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => onExpenseEdit(expense)}
                    sx={{ mr: 1 }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteExpense(expense.id)}
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
                      {expense.evidence_count && expense.evidence_count > 0 && (
                        <Chip
                          icon={<AttachmentOutlined />}
                          label={`${expense.evidence_count} evidence`}
                          size="small"
                          color="info"
                          variant="outlined"
                          onClick={() => onViewEvidence(expense.id)}
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
}

export default TripExpenses;
