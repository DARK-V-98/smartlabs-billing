export type SessionCategory =
  | 'Recorded Sessions'
  | 'Individual Session'
  | 'Physical Class'
  | 'Group Online Class'
  | 'Workshop & Bootcamp'
  | 'Admission Fee'
  | 'Custom';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Online / QR';

export interface ReceiptItem {
  id: string;
  category: SessionCategory;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InstituteInfo {
  name: string;
  tagline: string;
  address: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  website: string;
  registrationNumber: string;
  cashierName: string;
  currentUserName?: string;
  adminName?: string;
  logoUrl?: string;
  terms: string[];
}

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  type: 'Receipt' | 'Invoice' | 'Bill';
  issueDate: string;
  issueTime: string;
  studentName: string;
  studentId: string;
  studentPhone: string;
  studentEmail?: string;
  batch: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  balanceDueDate?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  status: 'Paid in Full' | 'Partial / Advance' | 'Pending';
}

export const DEFAULT_INSTITUTE_INFO: InstituteInfo = {
  name: 'Smartlabs (Pvt) Ltd',
  tagline: 'Center for Technology, Innovation & Academic Excellence',
  address: '19/3 Poorwarama Rd, Nugegoda 10250',
  phonePrimary: '070 491 4652',
  phoneSecondary: '076 691 4650 | 077 453 3233',
  email: 'info@smartlabs.lk',
  website: 'www.smartlabs.lk',
  registrationNumber: 'PV 00294183',
  cashierName: 'SmartLabs Reception Counter 01',
  currentUserName: '',
  adminName: '',
  terms: [
    'Fees once paid are non-refundable and non-transferable under any circumstances.',
    'Please present this official receipt for class attendance, campus access, and course materials.',
    'Any outstanding balance must be settled on or before the specified due date.',
    'Smartlabs (Pvt) Ltd reserves the right to verify registration credentials upon lab entry.'
  ]
};

export const QUICK_SESSION_PRESETS: {
  category: SessionCategory;
  label: string;
  defaultTitle: string;
  typicalFee: number;
  badgeColor: string;
}[] = [
  {
    category: 'Recorded Sessions',
    label: 'Recorded Sessions',
    defaultTitle: 'Recorded Sessions Full Module Access',
    typicalFee: 6500,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    category: 'Individual Session',
    label: 'Individual Session',
    defaultTitle: 'Individual 1-on-1 Practical & Mentoring Session',
    typicalFee: 4500,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    category: 'Physical Class',
    label: 'Physical Class',
    defaultTitle: 'Physical Class - In-Person Classroom Lectures',
    typicalFee: 50000,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    category: 'Group Online Class',
    label: 'Group Online Class',
    defaultTitle: 'Interactive Live Online Group Sessions',
    typicalFee: 35000,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200'
  },
  {
    category: 'Workshop & Bootcamp',
    label: 'Workshop / Bootcamp',
    defaultTitle: 'Weekend Intensive Practical Tech Bootcamp',
    typicalFee: 15000,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    category: 'Admission Fee',
    label: 'Admission Fee',
    defaultTitle: 'Annual Institute Registration & Student Kit',
    typicalFee: 5000,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

export const POPULAR_COURSES = [
  'Python for Data Science & AI',
  'Robotics & Embedded Hardware Engineering',
  'Full Stack Web Development (MERN)',
  'A/L ICT Comprehensive Theory & Revision',
  'IoT & Smart Automation Systems',
  'Cybersecurity & Network Defense',
  'Mobile App Engineering with React Native / Flutter',
  'UI/UX Design & Product Prototyping',
  'Game Development with Unity / C#'
];
