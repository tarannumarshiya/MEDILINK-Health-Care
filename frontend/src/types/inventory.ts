export type Medicine = {
  id: string;
  name: string;
  batch_no: string;
  quantity: number;
  expiry_date: string;
  supplier_id: string | null;
  reorder_level: number;
  price: number;
  /* Display */
  supplier_name?: string;
};

export type Vendor = {
  id: string;
  name: string;
  contact: string;
  email: string;
};

export type PharmacyOrder = {
  id: string;
  prescription_id: string;
  status: string;
  delivery_type: string; // "pickup" | "home_delivery"
  total: number;
  created_at: string;
  /* Display */
  patient_name?: string;
  prescription_code?: string;
};
