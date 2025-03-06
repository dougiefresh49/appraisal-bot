export interface PropertyIdentifier {
  address: string;
  apn: string;
  zip?: string;
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
