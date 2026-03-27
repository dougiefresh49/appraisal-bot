import { SheetParcel, SheetParcelImprovement, SheetSale } from './sheets-types';
import { RealApiResponse, SearchResult } from './types';

/**
 * Computes the Levenshtein distance between two strings.
 * This is used to score how “close” a candidate address is to the input address.
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Finds the search result whose address most closely matches the input address.
 */
export function findClosestMatch(
  results: SearchResult[],
  targetAddress: string
): SearchResult | null {
  if (results.length === 0) return null;

  let closest = results[0];
  let minDistance = levenshtein(
    results[0].address.toLowerCase(),
    targetAddress.toLowerCase()
  );

  for (let i = 1; i < results.length; i++) {
    const distance = levenshtein(
      results[i].address.toLowerCase(),
      targetAddress.toLowerCase()
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = results[i];
    }
  }
  return closest;
}

/**
 * Sanitizes a string so it can be safely used as a filename.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

export function parseRealApiResponse(
  response?: RealApiResponse,
  _instrumentNumber?: string
) {
  if (!response) return undefined;

  const instrumentNumber =
    _instrumentNumber ?? response.data.lastSale.documentNumber ?? undefined;
  const sale: SheetSale = {
    address: response.data.propertyInfo.address.label,
    saleDate: response.data.lastSale.saleDate ?? undefined,
    salePrice: response.data.lastSale.saleAmount ?? undefined,
    grantor: response.data.lastSale.sellerNames ?? undefined,
    grantee: response.data.lastSale.buyerNames ?? undefined,
    instrumentNumber,
    mlsNumber: undefined,
    saleTerms: response.data.lastSale.purchaseMethod ?? undefined,
  };

  const numBuildings = response.data.propertyInfo.buildingsCount ?? 0;
  // create numBuildings number of improvements
  const improvements: SheetParcelImprovement[] = new Array(numBuildings)
    .fill(null)
    .map((_, i) => ({
      APN: response.data.lotInfo.apn,
      buildingNumber: String(i + 1),
      sectionNumber: '1',
      yearBuilt: response.data.propertyInfo.yearBuilt ?? undefined,
      grossBuildingAreaSquareFeet:
        response.data.propertyInfo.buildingSquareFeet ?? undefined,
      officeAreaSquareFeet: undefined,
      warehouseAreaSquareFeet: undefined,
      storageAreaSquareFeet: undefined,
      comments: undefined,
    }));

  const parcels: SheetParcel[] = [
    {
      APN: response.data.lotInfo.apn,
      instrumentNumber,
      location: response.data.propertyInfo.address.address,
      legalDescription: response.data.lotInfo.legalDescription,
      lotNumber: response.data.lotInfo.lotNumber,
      sizeAcres: response.data.lotInfo.lotAcres,
      sizeSquareFeet: response.data.lotInfo.lotSquareFeet,
      grossBuildingSizeSquareFeet:
        response.data.propertyInfo.buildingSquareFeet,
      officeAreaSquareFeet: undefined,
      warehouseAreaSquareFeet: undefined,
      taxAmount: response.data.taxInfo.taxAmount,
    },
  ];

  return { ...sale, parcels, improvements };
}
