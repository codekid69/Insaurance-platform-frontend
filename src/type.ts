// roles & statuses
export type Role = "company" | "provider" | "admin";
export type KycStatus = "pending" | "verified" | "rejected";
export type RequestStatus = "open" | "consortium_formed" | "finalized" | "closed";
export type BidStatus = "pending" | "accepted" | "rejected" | "withdrawn" | "expired";

// core users
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgName?: string;                // ⬅ added (now returned by auth endpoints)
  kycStatus: KycStatus;
  kycResubmitCount?: number;
}

export interface ProviderLite {
  id: string;
  name: string;
  orgName?: string;
  email: string;
  kycStatus: KycStatus;
}

// auth payloads
export interface AuthPayload {
  email: string;
  password: string;
}
export interface RegisterPayload extends AuthPayload {
  name: string;
  role: Role;
  orgName?: string; // required for company/provider on FE validate, optional in type
}
export interface AuthResponse {
  token: string;
  user: User;
}

// asset model (NEW)
export interface Geo {
  lat: number;
  lng: number;
}
export interface Location {
  country?: string;
  city?: string;
  geo?: Geo;
}
export interface Attachment {
  url: string;
  name?: string;
  type?: string;
  size?: number;
}
export interface Asset {
  description: string;
  sumInsured: number;
  currency?: string;            // default 'USD' server-side
  location?: Location;
  riskDetails?: string;
  attachments?: Attachment[];
}

// requests
export interface InsuranceRequest {
  id?: string;
  _id?: string;
  clientId: string;
  title: string;
  summary?: string;
  targetCoverage: number;        // percent (1..100)
  status: RequestStatus;
  deadline: string;              // required (ISO)
  asset: Asset;                  // ⬅ added
  consortiumId?: string;
  acceptedProviders?: string[];
  finalizedAt?: string;
  createdAt?: string;
}

export interface CreateRequestBody {
  title: string;
  summary?: string;
  targetCoverage?: number;       // default 100 if omitted
  deadline: string;              // must be future date
  asset: Asset;                  // required
}

// bids
export interface Bid {
  id?: string;
  _id?: string;
  requestId: string;
  providerId: string;
  coveragePercent: number;       // 1..100
  premium: number;               // >= 0
  premiumCurrency?: string;      // ⬅ added
  validUntil?: string;           // ⬅ added (ISO)
  sumInsuredSnapshot?: number;   // ⬅ added
  terms?: string;
  status: BidStatus;
  provider?: ProviderLite | null;
  createdAt?: string;
  updatedAt?: string;
}

// consortium
export interface ConsortiumEntry {
  bidId: string;
  providerId: string;
  coveragePercent: number;
  premium: number;
  premiumCurrency?: string;      // ⬅ added
  termsSnapshot?: string;        // ⬅ added
}
export interface Consortium {
  requestId: string;
  entries: ConsortiumEntry[];
  totalCoverage: number;
  isLocked: boolean;
  sumInsuredSnapshot?: number;   // ⬅ added
  currency?: string;             // ⬅ added
  finalizedAt?: string;          // ⬅ added
}

// company card for awards
export type CompanyCard = {
  id: string;
  name: string;
  orgName?: string;
  email?: string;
};

// provider awards (matches new /providers/me/awards response)
export type Award = {
  request: {
    id: string;
    title: string;
    summary?: string;
    status: RequestStatus;
    targetCoverage: number;
    finalizedAt?: string;
    sumInsured?: number;         // ⬅ added (from request.asset)
    currency?: string;           // ⬅ added (from request.asset)
    deadline?: string;           // ⬅ added
  };
  allocation: {                  // ⬅ added block
    coveragePercent: number;
    premium: number;
    premiumCurrency?: string;
  };
  company: CompanyCard | null;
};

// util
export const docId = (d: { id?: string; _id?: string }) => d.id ?? d._id ?? "";
