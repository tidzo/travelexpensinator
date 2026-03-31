import { useState, useEffect, useRef } from 'react';
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
import { Add, Edit, Delete, AttachFile, AttachmentOutlined, Link } from '@mui/icons-material';
import { ExpenseItem, Trip, Journey, Leg, Location, ExpenseCategory, EvidenceItem } from '../types';
import { api } from '../services/api';

function ExpensesList() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [uploadingExpenseId, setUploadingExpenseId] = useState<number | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedExpenseEvidence, setSelectedExpenseEvidence] = useState<EvidenceItem[]>([]);
  const [linkEvidenceDialogOpen, setLinkEvidenceDialogOpen] = useState(false);
  const [linkingExpenseId, setLinkingExpenseId] = useState<number | null>(null);
  const [availableEvidence, setAvailableEvidence] = useState<EvidenceItem[]>([]);
  const [evidenceDetailDialogOpen, setEvidenceDetailDialogOpen] = useState(false);
  const [selectedEvidenceDetail, setSelectedEvidenceDetail] = useState<EvidenceItem | null>(null);
  const [evidenceLinkedExpenses, setEvidenceLinkedExpenses] = useState<ExpenseItem[]>([]);
  const [availableExpensesForEvidence, setAvailableExpensesForEvidence] = useState<ExpenseItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const [expensesData, tripsData, journeysData, legsData, locationsData, categoriesData] = await Promise.all([
        api.get<ExpenseItem[]>(`/expenses?month=${filterMonth}&year=${filterYear}`),
        api.get<Trip[]>('/trips'),
        api.get<Journey[]>('/journeys'),
        api.get<Leg[]>('/legs'),
        api.get<Location[]>('/locations'),
        api.get<ExpenseCategory[]>('/expense-categories')
      ]);
      setExpenses(expensesData);
      setTrips(tripsData);
      setJourneys(journeysData);
      setLegs(legsData);
      setLocations(locationsData);
      setCategories(categoriesData);
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

  const handleFileUpload = async (expenseId: number) => {
    setUploadingExpenseId(expenseId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingExpenseId) return;

    try {
      const expense = expenses.find(e => e.id === uploadingExpenseId);
      if (!expense) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_date', expense.date);
      formData.append('description', `Evidence for: ${expense.description}`);

      const evidenceItem = await api.uploadFile('/files/upload', formData);

      // Link the evidence to the expense
      await api.post('/expense-evidence-links', {
        expense_item_id: uploadingExpenseId,
        evidence_item_id: evidenceItem.id
      });

      // Refresh expenses to show any updates
      loadData();

      alert('Evidence uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setUploadingExpenseId(null);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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

      // Refresh the expenses list to update evidence counts
      loadData();

      // Close the dialog
      setLinkEvidenceDialogOpen(false);
      setLinkingExpenseId(null);

      alert('Evidence linked successfully!');
    } catch (error) {
      console.error('Failed to link evidence:', error);
      alert('Failed to link evidence. It might already be linked to this expense.');
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!window.confirm('Are you sure you want to delete this evidence item? This will permanently remove the file and all its links to expenses. This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/files/${evidenceId}`);

      // Remove the evidence from the dialog list
      setSelectedExpenseEvidence(selectedExpenseEvidence.filter(e => e.id !== evidenceId));

      // Refresh the expenses list to update evidence counts
      loadData();

      alert('Evidence deleted successfully!');
    } catch (error) {
      console.error('Failed to delete evidence:', error);
      alert('Failed to delete evidence. Please try again.');
    }
  };

  const handleOpenEvidenceDetail = async (evidence: EvidenceItem) => {
    try {
      setSelectedEvidenceDetail(evidence);

      // Get all expenses linked to this evidence
      const linkedExpenses = await api.get<ExpenseItem[]>(`/files/${evidence.id}/expenses`);
      setEvidenceLinkedExpenses(linkedExpenses);

      // Get expenses from current month that don't have any evidence AND aren't already linked to this evidence
      const linkedExpenseIds = new Set(linkedExpenses.map(e => e.id));
      const availableExpenses = expenses.filter(expense =>
        !linkedExpenseIds.has(expense.id) &&
        (!expense.evidence_count || expense.evidence_count === 0)
      );
      setAvailableExpensesForEvidence(availableExpenses);

      setEvidenceDetailDialogOpen(true);
    } catch (error) {
      console.error('Failed to load evidence details:', error);
      alert('Failed to load evidence details.');
    }
  };

  const handleUnlinkExpenseFromEvidence = async (expenseId: number) => {
    if (!selectedEvidenceDetail) return;

    try {
      await api.delete(`/expense-evidence-links/${expenseId}/${selectedEvidenceDetail.id}`);

      // Update the linked expenses list
      setEvidenceLinkedExpenses(evidenceLinkedExpenses.filter(e => e.id !== expenseId));

      // Add the expense back to available expenses if it has no other evidence
      const unlinkedExpense = expenses.find(e => e.id === expenseId);
      if (unlinkedExpense && (!unlinkedExpense.evidence_count || unlinkedExpense.evidence_count <= 1)) {
        setAvailableExpensesForEvidence([...availableExpensesForEvidence, unlinkedExpense]);
      }

      // Refresh the expenses list to update evidence counts
      loadData();

      alert('Evidence unlinked successfully!');
    } catch (error) {
      console.error('Failed to unlink evidence:', error);
      alert('Failed to unlink evidence. Please try again.');
    }
  };

  const handleLinkExpenseToEvidence = async (expenseId: number) => {
    if (!selectedEvidenceDetail) return;

    try {
      await api.post('/expense-evidence-links', {
        expense_item_id: expenseId,
        evidence_item_id: selectedEvidenceDetail.id
      });

      // Move expense from available to linked
      const linkedExpense = availableExpensesForEvidence.find(e => e.id === expenseId);
      if (linkedExpense) {
        setEvidenceLinkedExpenses([...evidenceLinkedExpenses, linkedExpense]);
        setAvailableExpensesForEvidence(availableExpensesForEvidence.filter(e => e.id !== expenseId));
      }

      // Refresh the expenses list to update evidence counts
      loadData();

      alert('Evidence linked successfully!');
    } catch (error) {
      console.error('Failed to link evidence:', error);
      alert('Failed to link evidence. Please try again.');
    }
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
                    <IconButton
                      edge="end"
                      aria-label="attach"
                      sx={{ mr: 1 }}
                      onClick={() => handleFileUpload(expense.id)}
                      disabled={uploadingExpenseId === expense.id}
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
                        {expense.evidence_count && expense.evidence_count > 0 && (
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

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newExpense.category_id}
              onChange={(e) => setNewExpense({ ...newExpense, category_id: Number(e.target.value) })}
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

      {/* Evidence viewing dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={() => setEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Evidence Items</DialogTitle>
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
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/${evidence.file_path}`, '_blank')}
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenEvidenceDetail(evidence)}
                        sx={{ mr: 1 }}
                      >
                        Manage
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEvidence(evidence.id)}
                      >
                        Delete
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

      {/* Link existing evidence dialog */}
      <Dialog
        open={linkEvidenceDialogOpen}
        onClose={() => setLinkEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Link Existing Evidence</DialogTitle>
        <DialogContent>
          {availableEvidence.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No available evidence items to link. All existing evidence is already linked to this expense, or no evidence has been uploaded yet.
            </Typography>
          ) : (
            <List>
              {availableEvidence.map((evidence) => (
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
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/${evidence.file_path}`, '_blank')}
                        sx={{ mr: 1 }}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleLinkEvidenceToExpense(evidence.id)}
                      >
                        Link
                      </Button>
                    </Box>
                  </ListItem>
                </Card>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkEvidenceDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Evidence detail management dialog */}
      <Dialog
        open={evidenceDetailDialogOpen}
        onClose={() => setEvidenceDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEvidenceDetail ? `Manage Evidence: ${selectedEvidenceDetail.original_filename}` : 'Manage Evidence'}
        </DialogTitle>
        <DialogContent>
          {selectedEvidenceDetail && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Currently linked to:
              </Typography>
              {evidenceLinkedExpenses.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No expenses currently linked to this evidence.
                </Typography>
              ) : (
                <List sx={{ mb: 2 }}>
                  {evidenceLinkedExpenses.map((expense) => (
                    <Card key={expense.id} sx={{ mb: 1 }}>
                      <ListItem>
                        <ListItemText
                          primary={expense.description}
                          secondary={`${formatDate(expense.date)} • ${formatCurrency(expense.amount_gbp)}`}
                        />
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleUnlinkExpenseFromEvidence(expense.id)}
                        >
                          Unlink
                        </Button>
                      </ListItem>
                    </Card>
                  ))}
                </List>
              )}

              <Typography variant="h6" sx={{ mb: 1 }}>
                Available expenses (current month, no evidence):
              </Typography>
              {availableExpensesForEvidence.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No available expenses to link. Only expenses from the current month that don't have any evidence are shown here.
                </Typography>
              ) : (
                <List>
                  {availableExpensesForEvidence.map((expense) => (
                    <Card key={expense.id} sx={{ mb: 1 }}>
                      <ListItem>
                        <ListItemText
                          primary={expense.description}
                          secondary={`${formatDate(expense.date)} • ${formatCurrency(expense.amount_gbp)}`}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleLinkExpenseToEvidence(expense.id)}
                        >
                          Link
                        </Button>
                      </ListItem>
                    </Card>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvidenceDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input for evidence uploads */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.doc,.docx,.xls,.xlsx"
      />
    </Box>
  );
}

export default ExpensesList;