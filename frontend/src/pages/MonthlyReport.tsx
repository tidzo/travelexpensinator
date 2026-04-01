import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { MonthlyReport as MonthlyReportType } from '../types';
import { api } from '../services/api';
import { useDateContext } from '../contexts/DateContext';

function MonthlyReport() {
  const { selectedMonth, selectedYear } = useDateContext();
  const [report, setReport] = useState<MonthlyReportType | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.get<MonthlyReportType>(`/expenses/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatCurrencyOrBlank = (amount: number) => {
    return amount > 0 ? formatCurrency(amount) : '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('en-GB', { month: 'long' });
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

  const formatDescriptionWithNotes = (description: string) => {
    if (description.includes('\n')) {
      const [mainDesc, ...noteParts] = description.split('\n');
      const notes = noteParts.join('\n');
      return (
        <Box>
          <Typography component="span" variant="body2">{mainDesc}</Typography>
          <br />
          <Typography component="span" variant="body2" color="text.secondary" fontStyle="italic">{notes}</Typography>
        </Box>
      );
    }
    return description;
  };


  const handleGenerateCombinedPDF = async () => {
    try {
      const filename = `expenses_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.pdf`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reports/combined/pdf?month=${selectedMonth}&year=${selectedYear}`);

      if (!response.ok) {
        throw new Error('Failed to generate combined report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate combined report:', error);
      alert('Failed to generate report PDF. Please try again.');
    }
  };

  if (loading) {
    return <Typography>Loading report...</Typography>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Monthly Report
        </Typography>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={handleGenerateCombinedPDF}
        >
          Generate Report PDF
        </Button>
      </Box>

      {report && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {getMonthName(report.month)} {report.year} Summary
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Net (ex VAT)</TableCell>
                      <TableCell align="right">VAT</TableCell>
                      <TableCell align="right">Gross (Paid)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Standard Rated</TableCell>
                      <TableCell align="right">{formatCurrencyOrBlank(report.totals.standard_rated_gross - report.totals.standard_rated_vat)}</TableCell>
                      <TableCell align="right">{formatCurrencyOrBlank(report.totals.standard_rated_vat)}</TableCell>
                      <TableCell align="right">{formatCurrencyOrBlank(report.totals.standard_rated_gross)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zero-Rated or Out of Scope</TableCell>
                      <TableCell align="right">{formatCurrencyOrBlank(report.totals.zero_rated + report.totals.out_of_scope)}</TableCell>
                      <TableCell align="right">{formatCurrencyOrBlank(0)}</TableCell>
                      <TableCell align="right">{formatCurrencyOrBlank(report.totals.zero_rated + report.totals.out_of_scope)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>TOTAL</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency((report.totals.standard_rated_gross - report.totals.standard_rated_vat) + (report.totals.zero_rated + report.totals.out_of_scope))}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyOrBlank(report.totals.standard_rated_vat)}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(report.totals.total_expenses)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Billable: {formatCurrency(report.totals.billable_total)} |
                  Non-billable: {formatCurrency(report.totals.non_billable_total)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {report.trip_expenses.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Trip Expenses
                </Typography>

                {report.trip_expenses.map((tripGroup) => (
                  <Box key={tripGroup.trip.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: tripGroup.trip.notes ? 0.5 : 1 }}>
                      {formatTripName(tripGroup.trip.start_date, tripGroup.trip.end_date)}
                    </Typography>
                    {tripGroup.trip.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                        {tripGroup.trip.notes}
                      </Typography>
                    )}

                    <TableContainer component={(props: any) => <Paper variant="outlined" {...props} />}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Net (ex VAT)</TableCell>
                            <TableCell align="right">VAT</TableCell>
                            <TableCell align="right">Gross (Paid)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tripGroup.expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{formatDate(expense.date)}</TableCell>
                              <TableCell>{formatDescriptionWithNotes(expense.description)}</TableCell>
                              <TableCell align="right">{formatCurrencyOrBlank(expense.ex_vat_amount)}</TableCell>
                              <TableCell align="right">{formatCurrencyOrBlank(expense.vat_amount)}</TableCell>
                              <TableCell align="right">{formatCurrency(expense.amount_gbp)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {report.unlinked_expenses.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Other Expenses
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Net (ex VAT)</TableCell>
                        <TableCell align="right">VAT</TableCell>
                        <TableCell align="right">Gross (Paid)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.unlinked_expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>{formatDescriptionWithNotes(expense.description)}</TableCell>
                          <TableCell align="right">{formatCurrencyOrBlank(expense.ex_vat_amount)}</TableCell>
                          <TableCell align="right">{formatCurrencyOrBlank(expense.vat_amount)}</TableCell>
                          <TableCell align="right">{formatCurrency(expense.amount_gbp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}

export default MonthlyReport;