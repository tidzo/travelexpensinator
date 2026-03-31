export interface Location {
  id: number;
  name: string;
  type: 'HOME' | 'WORK' | 'HOTEL' | 'STATION' | 'AIRPORT' | 'OTHER';
  notes?: string;
  created_at: string;
}

export interface Trip {
  id: number;
  start_date: string;
  end_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  vat_status: 'STANDARD' | 'ZERO_RATED' | 'OUT_OF_SCOPE';
  default_amount?: number;
  created_at: string;
}

export interface ExpenseItem {
  id: number;
  trip_id?: number;
  journey_id?: number;
  leg_id?: number;
  category_id: number;
  date: string;
  description: string;
  amount_gbp: number;
  ex_vat_amount: number;
  vat_amount: number;
  is_billable: boolean;
  is_monthly_expense: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  id: number;
  file_path: string;
  stored_filename: string;
  original_filename: string;
  file_type: string;
  upload_date: string;
  description?: string;
  created_at: string;
}

export interface MonthlyReport {
  month: number;
  year: number;
  trip_expenses: Array<{
    trip: Trip;
    expenses: ExpenseItem[];
  }>;
  unlinked_expenses: ExpenseItem[];
  totals: {
    standard_rated_gross: number;
    standard_rated_vat: number;
    zero_rated: number;
    out_of_scope: number;
    total_expenses: number;
    billable_total: number;
    non_billable_total: number;
  };
}