import { MlsAreas } from './mls-areas';
import {
  MlsAreaName,
  PropertyIdentifier,
  PropertyType,
  RealApiResponse,
  SearchResult,
} from './types';

export async function fetchPropertyDetails(
  propertyId: string,
  property?: PropertyIdentifier
): Promise<RealApiResponse> {
  const id = propertyId !== '_' ? propertyId : undefined;
  const body = {
    id,
    apn: property?.apn ?? undefined,
    zip: property?.zip ?? undefined,
    comps: false,
  };
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-user-id': 'BASINAPPRAISALSLLC',
      'content-type': 'application/json',
      'x-api-key': process.env.REAL_API_KEY as string,
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(
    'https://api.realestateapi.com/v2/PropertyDetail',
    options
  );
  return response.json() as unknown as RealApiResponse;
}

export async function fetchNeighborStatByMlsArea(
  mlsArea: MlsAreaName,
  params?: {
    mfh_2to4?: boolean;
    corporate_owned?: boolean;
    property_type?: PropertyType;
    year_built_min?: number;
    year_built_max?: number;
  }
): Promise<any> {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-user-id': 'BASINAPPRAISALSLLC',
      'x-api-key': process.env.REAL_API_KEY as string,
    },
    body: JSON.stringify({
      count: true,
      // ids_only: true,
      polygon: MlsAreas[mlsArea]?.polygon,
      zip: MlsAreas[mlsArea]?.zip,
      ...params,
    }),
  };
  const response = await fetch(
    `https://api.realestateapi.com/v2/PropertySearch`,
    options
  );
  const results = await response.json();
  return results.resultCount ?? 0;
}

export async function searchProperty(search: string): Promise<SearchResult[]> {
  const options = {
    method: 'POST',
    headers: {
      'x-user-id': 'BASINAPPRAISALSLLC',
      'content-type': 'application/json',
      'x-api-key': process.env.REAL_API_KEY as string,
    },
    body: JSON.stringify({ search }),
  };

  const response = await fetch(
    'https://api.realestateapi.com/v2/AutoComplete',
    options
  );
  const data = await response.json();
  console.log(`Search results: ${JSON.stringify(data)}`);
  return data.data as SearchResult[];
}
