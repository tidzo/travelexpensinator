import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatTripName, formatDateWithDay } from '../utils/formatters';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  Receipt,
} from '@mui/icons-material';
import { Trip, Journey, Location, ExpenseCategory, ExpenseItem, EvidenceItem } from '../types';
import { api } from '../services/api';
import ExpenseDialog from '../components/ExpenseDialog';
import TripJourneys from '../components/TripJourneys';
import TripExpenses from '../components/TripExpenses';
import TripEvidence from '../components/TripEvidence';

function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
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


  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
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




  if (loading) {
    return <Typography>Loading trip details...</Typography>;
  }

  if (!trip) {
    return <Typography>Trip not found</Typography>;
  }

  return (
    <Box>
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

      <TripJourneys
        journeys={journeys}
        locations={locations}
        categories={categories}
        onJourneysChange={loadData}
      />

      <Typography variant="h5" component="h2" sx={{ mb: 2, mt: 3 }}>
        Trip Expenses
      </Typography>

      <TripExpenses
        expenses={expenses}
        categories={categories}
        onExpenseEdit={handleEditExpense}
        onExpenseDeleted={loadData}
        onFileUpload={handleFileUpload}
        onLinkEvidence={handleLinkExistingEvidence}
        onViewEvidence={handleViewEvidence}
      />

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
          loadData();
          setEditingExpense(null);
        }}
      />

      <TripEvidence
        linkEvidenceDialogOpen={linkEvidenceDialogOpen}
        onCloseLinkDialog={() => {
          setLinkEvidenceDialogOpen(false);
          setLinkingExpenseId(null);
          setAvailableEvidence([]);
        }}
        availableEvidence={availableEvidence}
        linkingExpenseId={linkingExpenseId}
        onEvidenceLinked={() => {
          loadData();
          setLinkEvidenceDialogOpen(false);
          setLinkingExpenseId(null);
          setAvailableEvidence([]);
        }}
        evidenceDialogOpen={evidenceDialogOpen}
        onCloseEvidenceDialog={() => setEvidenceDialogOpen(false)}
        selectedExpenseEvidence={selectedExpenseEvidence}
      />
    </Box>
  );
}

export default TripDetail;