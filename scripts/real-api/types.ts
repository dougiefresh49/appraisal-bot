export interface PropertyIdentifier {
  address: string;
  apn: string;
  zip?: string;
  cad?: 'ecad' | 'mcad';
  skip?: boolean;
  instrumentNumber?: string;
}

export interface SearchResult {
  zip: string;
  address: string;
  city: string;
  searchType: string;
  stateId: string;
  latitude: number;
  county: string;
  fips: string;
  title: string;
  house: string;
  countyId: string;
  street: string;
  location: string;
  id: string;
  state: string;
  apn: string;
  longitude: number;
}

export type Polygon = {
  lat: number;
  lon: number;
}[];

export type MlsArea = {
  name: string;
  description: string;
  zip: string;
  polygon: Polygon;
};

export type PropertyType =
  | 'SFR'
  | 'CONDO'
  | 'LAND'
  | 'MFR'
  | 'MOBILE'
  | 'OTHER';

export type MlsAreaMap = Record<MlsAreaName, MlsArea>;

export type MlsAreaName =
  | 'EA1'
  | 'EA3'
  | 'EA4'
  | 'EA5'
  | 'EB1'
  | 'EB2'
  | 'EB3'
  | 'EB4'
  | 'EB5'
  | 'EB6'
  | 'EB7'
  | 'EC1'
  | 'EC2'
  | 'EC3'
  | 'EC4'
  | 'EC5'
  | 'EC6'
  | 'EC7'
  | 'ED1'
  | 'ED2'
  | 'ED3'
  | 'ED4'
  | 'ED5'
  | 'ED6'
  | 'EE1'
  | 'EE2'
  | 'EE3'
  | 'EE4'
  | 'EE5'
  | 'EE6'
  | 'EE7'
  | 'EF1'
  | 'EF2'
  | 'EF3'
  | 'EF4'
  | 'EF5'
  | 'EF6'
  | 'EF7'
  | 'EG1'
  | 'EN1'
  | 'ES1'
  | 'ES2'
  | 'EW1'
  | 'EW2'
  | 'EW4'
  | 'EW5'
  | 'EW6'
  | 'EW7'
  | 'MA1'
  | 'MA2'
  | 'MA3'
  | 'MA4'
  | 'MA5'
  | 'MA6'
  | 'MA7'
  | 'MA8'
  | 'MB1'
  | 'MB2'
  | 'MB3'
  | 'MB4'
  | 'MB5'
  | 'MB6'
  | 'MB7'
  | 'MB8'
  | 'MC1'
  | 'MC2'
  | 'MC3'
  | 'MC4'
  | 'MC5'
  | 'MC6'
  | 'MC7'
  | 'MC8'
  | 'MD4'
  | 'MD5'
  | 'MD6'
  | 'MD7'
  | 'MD8'
  | 'ME1'
  | 'ME2'
  | 'ME3'
  | 'ME4'
  | 'ME5'
  | 'ME6'
  | 'ME7'
  | 'MF1'
  | 'MF2'
  | 'MF3'
  | 'MF4'
  | 'MF5'
  | 'MF6'
  | 'MF7'
  | 'MF8'
  | 'MG1'
  | 'MG2'
  | 'MG3'
  | 'MG4'
  | 'MG5'
  | 'MM1'
  | 'MM2'
  | 'MM3'
  | 'MM4'
  | 'MM5'
  | 'MM6'
  | 'MM7'
  | 'MS1'
  | 'MS2'
  | 'MS3'
  | 'MS4'
  | 'MS5'
  | 'MS6'
  | 'MS7';

export interface RealApiResponse {
  input: {
    comps: boolean;
    id: number;
  };
  data: RealApiPropertyData;
  statusCode: number;
  statusMessage: string;
  live: boolean;
  requestExecutionTimeMS: string;
  propertyLookupExecutionTimeMS: string;
  compsLookupExecutionTimeMS: string | null;
}

export interface RealApiPropertyData {
  id: number;
  MFH2to4: boolean;
  MFH5plus: boolean;
  absenteeOwner: boolean;
  adjustableRate: string | null;
  assumable: string | null;
  auction: boolean;
  equity: string | null;
  bankOwned: string | null;
  cashBuyer: string | null;
  cashSale: string | null;
  corporateOwned: boolean;
  death: string | null;
  deathTransfer: string | null;
  deedInLieu: string | null;
  equityPercent: number;
  estimatedEquity: number;
  estimatedMortgageBalance: string;
  estimatedMortgagePayment: string;
  estimatedValue: number;
  floodZone: boolean;
  floodZoneDescription: string | null;
  floodZoneType: string | null;
  freeClear: boolean;
  highEquity: boolean;
  inStateAbsenteeOwner: boolean;
  inherited: string | null;
  investorBuyer: boolean;
  judgment: boolean;
  lastSaleDate: string | null;
  lastSalePrice: string;
  lastUpdateDate: string;
  lien: string | null;
  loanTypeCodeFirst: string | null;
  loanTypeCodeSecond: string | null;
  loanTypeCodeThird: string | null;
  maturityDateFirst: string | null;
  mlsActive: boolean;
  mlsCancelled: boolean;
  mlsDaysOnMarket: string | null;
  mlsFailed: boolean;
  mlsFailedDate: string | null;
  mlsHasPhotos: boolean;
  mlsLastSaleDate: string | null;
  mlsLastStatusDate: string | null;
  mlsListingDate: string | null;
  mlsListingPrice: string | null;
  mlsListingPricePerSquareFoot: string | null;
  mlsPending: boolean;
  mlsSold: boolean;
  mlsSoldPrice: string | null;
  mlsStatus: string | null;
  mlsTotalUpdates: string | null;
  mlsType: string | null;
  mobileHome: boolean;
  noticeType: string | null;
  openMortgageBalance: number;
  outOfStateAbsenteeOwner: boolean;
  ownerOccupied: boolean;
  preForeclosure: boolean;
  privateLender: string | null;
  propertyType: string;
  quitClaim: string | null;
  reapi_loaded_at: string | null;
  sheriffsDeed: string | null;
  spousalDeath: string | null;
  taxLien: string | null;
  trusteeSale: string | null;
  vacant: boolean;
  warrantyDeed: string | null;
  auctionInfo: Record<string, unknown>;
  currentMortgages: unknown[];
  demographics: RealApiDemographics;
  foreclosureInfo: unknown[];
  lastSale: RealApiLastSale;
  linkedProperties: RealApiLinkedProperties;
  lotInfo: RealApiLotInfo;
  mlsHistory: unknown[];
  mlsKeywords: Record<string, unknown>;
  mortgageHistory: unknown[];
  neighborhood: Record<string, unknown>;
  ownerInfo: RealApiOwnerInfo;
  propertyInfo: RealApiPropertyInfo;
  saleHistory: unknown[];
  schools: unknown[];
  taxInfo: RealApiTaxInfo;
}

export interface RealApiDemographics {
  fmrEfficiency: string;
  fmrFourBedroom: string;
  fmrOneBedroom: string;
  fmrThreeBedroom: string;
  fmrTwoBedroom: string;
  fmrYear: string;
  hudAreaCode: string;
  hudAreaName: string;
  medianIncome: string;
  suggestedRent: string | null;
}

export interface RealApiLastSale {
  book: string | null;
  page: string | null;
  documentNumber: string | null;
  armsLength: string | null;
  buyerNames: string | null;
  documentType: string | null;
  documentTypeCode: string | null;
  downPayment: string | null;
  ltv: string | null;
  ownerIndividual: string | null;
  priorOwnerIndividual: string | null;
  priorOwnerMonthsOwned: string | null;
  purchaseMethod: string | null;
  recordingDate: string | null;
  saleAmount: string | null;
  saleDate: string | null;
  sellerNames: string | null;
  seqNo: number;
  transactionType: string | null;
}

export interface RealApiLinkedProperties {
  ids: string[];
  purchasedLast12mos: number;
  purchasedLast6mos: number;
  totalEquity: string;
  totalMortgageBalance: string;
  totalOwned: string;
  totalValue: string;
}

export interface RealApiLotInfo {
  apn: string;
  apnUnformatted: string;
  censusBlock: string;
  censusBlockGroup: string;
  censusTract: string;
  landUse: string;
  legalDescription: string;
  legalSection: string | null;
  lotAcres: string;
  lotNumber: string;
  lotSquareFeet: number;
  propertyClass: string | null;
  propertyUse: string | null;
  subdivision: string;
  zoning: string | null;
}

export interface RealApiOwnerInfo {
  absenteeOwner: boolean;
  companyName: string | null;
  corporateOwned: boolean;
  equity: string | null;
  inStateAbsenteeOwner: boolean;
  mailAddress: RealApiAddress;
  outOfStateAbsenteeOwner: boolean;
  owner1FirstName: string | null;
  owner1FullName: string;
  owner1LastName: string;
  owner1Type: string;
  owner2FirstName: string | null;
  owner2FullName: string;
  owner2LastName: string | null;
  owner2Type: string;
  ownerOccupied: boolean;
  ownershipLength: string | null;
}

export interface RealApiPropertyInfo {
  address: RealApiAddress;
  airConditioningType: string | null;
  attic: boolean;
  basementFinishedPercent: string | null;
  basementSquareFeet: number;
  basementSquareFeetFinished: number;
  basementSquareFeetUnfinished: number;
  basementType: string;
  bathrooms: string | null;
  bedrooms: string | null;
  breezeway: boolean;
  buildingSquareFeet: number;
  buildingsCount: number;
  carport: boolean;
  construction: string | null;
  deck: boolean;
  deckArea: number;
  featureBalcony: boolean;
  fireplace: boolean;
  fireplaces: string | null;
  garageSquareFeet: number;
  garageType: string | null;
  heatingFuelType: string | null;
  heatingType: string | null;
  hoa: string | null;
  interiorStructure: string | null;
  latitude: number;
  livingSquareFeet: number;
  longitude: number;
  lotSquareFeet: number;
  parcelAccountNumber: string | null;
  parkingSpaces: number;
  partialBathrooms: number;
  patio: boolean;
  patioArea: string;
  plumbingFixturesCount: number;
  pool: boolean;
  poolArea: number;
  porchArea: string | null;
  porchType: string | null;
  pricePerSquareFoot: number;
  propertyUse: string;
  propertyUseCode: number;
  roofConstruction: string | null;
  roofMaterial: string | null;
  roomsCount: number;
  rvParking: boolean;
  safetyFireSprinklers: boolean;
  stories: string | null;
  taxExemptionHomeownerFlag: boolean;
  unitsCount: number;
  utilitiesSewageUsage: string | null;
  utilitiesWaterSource: string | null;
  yearBuilt: number;
}

export interface RealApiAddress {
  address: string;
  addressFormat: string | null;
  carrierRoute: string | null;
  city: string;
  congressionalDistrict?: string;
  county: string;
  fips: string;
  house: string;
  jurisdiction?: string;
  label: string;
  preDirection: string | null;
  state: string;
  street: string;
  streetType: string | null;
  unit: string | null;
  unitType: string | null;
  zip: string;
  zip4: string;
}

export interface RealApiTaxInfo {
  assessedImprovementValue: number;
  assessedLandValue: number;
  assessedValue: number;
  assessmentYear: number;
  estimatedValue: string | null;
  marketImprovementValue: number;
  marketLandValue: number;
  marketValue: number;
  propertyId: number;
  taxAmount: string;
  taxDelinquentYear: string | null;
  year: number;
}
