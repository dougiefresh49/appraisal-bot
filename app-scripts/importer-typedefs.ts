/* --- UTILITY TYPES --- */
type Generated = 'GENERATED' | 'BLANK' | null;
type Condition = 'Good' | 'Average' | 'Fair' | 'Poor';
type YesNoUnknown = boolean | null;

// --- ENUMERATED TYPES ---
type UseType = 'Sale' | 'Extra' | 'Rental';
type SubjectParcelType = 'Improvements' | 'Excess Land';
type ZoningLocation =
  | 'Inside City Limits'
  | 'Inside & Outside City Limits'
  | 'Inside ETJ'
  | 'Outside ETJ'
  | 'None';
type FrontageType =
  | 'Highway'
  | 'Main'
  | 'Secondary'
  | 'Dirt'
  | 'None'
  | 'Yes'
  | 'No';
type HasFencing = 'Yes' | 'Partial' | 'No';
type FenceType = 'Wood' | 'Barbed Wire' | 'Chainlink' | 'Metal' | 'Unk';
type UtilitiesStatus = 'Available' | 'Part. Available' | 'None';
type UtilsElectricity = 'Yes' | 'No' | 'Unk';
type UtilsWater = 'Public' | 'Well' | 'None' | 'Unk';
type UtilsSewer = 'Public' | 'Septic' | 'None' | 'Unk';
type LandSurface = 'Cleared' | 'Caliche' | 'Raw';
type ConditionsOfSaleType =
  | "Arm's Length"
  | 'Owner Finance'
  | 'Sale-Leaseback'
  | 'Listing'
  | "Not Arm's Length"
  | 'Other';
type VerificationType =
  | 'Appraiser'
  | 'Broker'
  | 'Realtor'
  | 'Crexi'
  | 'MLS/CAD/Deeds'
  | 'Owner'
  | 'Other'
  | 'Buyer'
  | 'Seller';

type ExpenceStructure = 'NNN' | 'NN' | 'N' | 'None';
type TenantStructure = 'Individual' | 'Multiple';
type HvacOptions = 'Yes' | 'Office Only' | 'No';

// --- MAIN OUTPUT STRUCTURE ---

interface OutputData {
  landSaleData: LandSaleData[];
  saleData: SaleData[];
  rentalData: RentalData[];
  parcelData: ParcelData[];
  parcelImprovements: ParcelImprovement[];
  subject: SubjectData[];
  subjectTaxes: SubjectTax[];
  taxEntities: TaxEntity[];
}

// --- DATA INTERFACES ---

interface LandSaleData {
  '#': number;
  Address: string;
  'Use Type': UseType;
  Grantor: string;
  Grantee: string;
  Recording: string;
  'Date of Sale': string;
  'Market Conditions': Generated;
  'Sale Price': string;
  'Financing Terms': string;
  'Property Rights': string;
  'Conditions of Sale': ConditionsOfSaleType;
  'Sale Price / AC': Generated;
  'Sale Price / SF': Generated;
  'Land Size (AC)': Generated;
  'Land Size (SF)': Generated;
  APN: Generated;
  Legal: Generated;
  Corner: boolean;
  Frontage: FrontageType;
  'Has Fencing': HasFencing;
  'Fence Type': FenceType;
  Fencing: string | null; // UI Label: Fencing Notes
  'Utils - Electricity': UtilsElectricity;
  'Utils - Water': UtilsWater | null;
  'Utils - Sewer': UtilsSewer | null;
  Utilities: UtilitiesStatus; // UI Label: Utilities (Overall)
  Surface: LandSurface | null;
  'Zoning Location': ZoningLocation;
  'Zoning Description': string;
  Zoning: Generated;
  Taxes: Generated;
  'MLS #': string | null;
  'Verification Type': VerificationType | null;
  'Verified By': string | null;
  Verification: Generated;
  Comments: string | null;
}

interface SaleData {
  '#': number;
  Address: string;
  'Use Type': UseType;
  Grantor: string;
  Grantee: string;
  Recording: string;
  'Date of Sale': string;
  'Market Conditions': Generated;
  'Sale Price': string;
  'Adj Sale Price': Generated;
  'Financing Terms': string;
  'Property Rights': string;
  'Conditions of Sale': ConditionsOfSaleType;
  'Renovation Cost': number | null;
  'Sale Price / SF': Generated;
  'Sale Price / SF (Adj)': Generated;
  'Improvements / SF': Generated;
  'Land Size (AC)': Generated;
  'Land Size (SF)': Generated;
  'Excess Land Size (AC)': Generated;
  'Excess Land Value / AC': number | null;
  'Excess Land Value': Generated;
  APN: Generated;
  Legal: Generated;
  'Parking (SF)': Generated;
  'Building Size (SF)': Generated;
  'Office Area (SF)': Generated;
  'Warehouse Area (SF)': Generated;
  'Office %': Generated;
  'Warehouse %': Generated;
  'Occupancy %': string | null;
  'Land / Bld Ratio': Generated;
  'Land / Bld Ratio (Adj)': Generated;
  'Property Type': string | null;
  Construction: string | null;
  'Other Features Description': string | null;
  'Other Features': Generated;
  HVAC: HvacOptions;
  'Overhead Doors': string | null;
  'Wash Bay': YesNoUnknown;
  Hoisting: string | null;
  'Has Fencing': HasFencing;
  Buildings: Generated;
  'Year Built': Generated;
  'Effective Age': Generated;
  Age: Generated;
  Condition: Condition | null;
  'Zoning Location': ZoningLocation;
  'Zoning Description': string;
  Zoning: Generated;
  'Rent / Month': number | null;
  'Rent / SF': Generated;
  'Potential Gross Income': Generated;
  'Vacancy %': Generated;
  Vacancy: Generated;
  'Effective Gross Income': Generated;
  Taxes: Generated;
  Insurance: Generated;
  Expenses: Generated;
  'Net Operating Income': Generated;
  'Overall Cap Rate': Generated;
  GPI: Generated;
  'Gross Income Multiplier': Generated;
  'Potential Value': Generated;
  'MLS #': string | null;
  'Verification Type': VerificationType | null;
  'Verified By': string | null;
  Verification: Generated;
  Comments: string | null;
}

interface RentalData {
  '#': number;
  Address: string;
  'Use Type': string;
  Lessor: string;
  Tenant: string | null;
  Recording: string | null;
  APN: string | null;
  Legal: string | null;
  'Zoning Location': ZoningLocation;
  'Zoning Description': string;
  Zoning: string | null;
  'Land Size (AC)': number | null;
  'Land Size (SF)': number | null;
  'Rentable SF': number | null;
  'Office %': Generated;
  'Land / Bld Ratio': number | null;
  'Occupancy %': string;
  'Property Type': string;
  'Lease Start': string | null;
  'Rent / Month Start': number;
  'Lease Term': string | null;
  '% Increase / Year': number;
  'Rent / Month': number | null;
  'Expense Structure': ExpenceStructure;
  'Rent / SF / Year': Generated;
  'Tenant Structure': TenantStructure;
  'Year Built': number | null;
  Age: number | null;
  'Effective Age': Generated;
  Condition: Condition;
  HVAC: HvacOptions;
  'Overhead Doors': string | null; // if size is known, put in the format of WxH (xQuantity). Ex: 14x12 (x6)
  'Wash Bay': YesNoUnknown;
  Hoisting: string | null; // None, Unknown, xT (where x is the tonage of the crane). if there are multiple cranes, list all of them. Ex: 2T (x2),5T (x3)
  Construction: string | null;
  'Other Features': string;
  'MLS #': string | null;
  'Verification Type': VerificationType | null;
  'Verified By': string | null;
  Verification: Generated;
  Comments: string;
}

interface SubjectData {
  Address: string;
  Type: SubjectParcelType;
  APN: Generated;
  Legal: Generated;
  'Property Rights': string;
  instrumentNumber: string | null;
  'Date of Sale': string; // always "Current" for subject
  'Market Conditions': Generated;
  'Post Sale Renovation Cost': number | null;
  Tenant: string | null;
  'Lease Start': string | null;
  'Rent / Month': number | null;
  'Rent / SF / Year': Generated;
  'Expense Structure': ExpenceStructure | null;
  'Occupancy %': string | null;
  'Land Size (AC)': Generated;
  'Land Size (SF)': Generated;
  'Parking (SF)': Generated;
  'Parking Spaces': number | null;
  'Parking Spaces Details': string | null;
  'Parking Ratio': Generated;
  'Building Size (SF)': Generated;
  'Office Area (SF)': Generated;
  'Warehouse Area (SF)': Generated;
  'Office %': Generated;
  'Floor Area Ratio': Generated;
  'Land / Bld Ratio': Generated;
  'Total Taxes': Generated;
  'County Appraised Value': Generated;
  City: string;
  State: string;
  County: string;
  Zip: string;
  AddressLabel: Generated;
  AddressLocal: Generated;
  'Zoning Area': string;
  'Zoning Description': string;
  Zoning: Generated;
  'Other Features': string | null;
  'Wash Bay': YesNoUnknown;
  Hoisting: string | null;
  Corner: boolean;
  'Highway Frontage': boolean;
  Frontage: FrontageType | null;
  'Utils - Electricity': YesNoUnknown;
  'Utils - Water': UtilsWater;
  'Utils - Sewer': UtilsSewer;
  Utilities: UtilitiesStatus | null;
  Surface: LandSurface | null;
  'Property Type': string | null;
  'Property Type Long': string | null;
  Construction: string | null;
  Condition: Condition;
  'Year Built': Generated;
  Age: Generated;
  'Effective Age': Generated;
  'Est Insurance': Generated;
  'Est Expences': Generated;
  'Size Multiplier': Generated;
}

interface ParcelData {
  instrumentNumber: string | null;
  APN: string;
  'APN Link': string;
  Location: string;
  Legal: string;
  'Lot #': string | null;
  'Size (AC)': number | null;
  'Size (SF)': number | null;
  'Building Size (SF)': number | null;
  'Parking (SF)': number | null;
  'Storage Area (SF)': number | null;
  Buildings: number | null;
  'Total Tax Amount': string | null;
  'County Appraised Value'?: string;
}

interface ParcelImprovement {
  instrumentNumber: string | null;
  APN: string;
  'Building #': number;
  'Section #': number;
  'Year Built': number | null;
  'Gross Building Area (SF)': number | null;
  'Office Area (SF)': number | null;
  'Warehouse Area (SF)': number | null;
  'Parking (SF)': number | null;
  'Storage Area (SF)': number | null;
  'Is GLA': boolean;
  Construction: string;
  Comments: string | null;
}

interface SubjectTax {
  Entity: string;
  Amount: number;
}

interface TaxEntity {
  Entity: string;
  Rate: number;
}
