export interface Location {
  id: number;
  name: string;
  type: 'HOME' | 'WORK' | 'HOTEL' | 'STATION' | 'OTHER';
  notes?: string;
  created_at: string;
}

export interface Journey {
  id: number;
  trip_id: number;
  date: string;
  description?: string;
  created_at: string;
}

export interface Leg {
  id: number;
  journey_id: number;
  mode_of_transport: 'TRAIN' | 'TFL' | 'TAXI' | 'COACH' ;
  origin_location_id: number;
  destination_location_id: number;
  notes?: string;
  created_at: string;
  origin_location?: Location;
  destination_location?: Location;
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
  evidence_count?: number;
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
