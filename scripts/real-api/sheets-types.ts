
/*
instrumentNumber
APN
APN Link
Location
Legal
Lot #
Size (AC)
Size (SF)
Gross Building Size (SF)
Office Area (SF)
Warehouse Area (SF)
*/

export type SheetParcel = {
  instrumentNumber?: string;
  APN: string;
  APNLink?: string;
  location: string;
  legalDescription: string;
  lotNumber: string;
  sizeAcres?: string;
  sizeSquareFeet?: number;
  grossBuildingSizeSquareFeet?: number;
  officeAreaSquareFeet?: number;
  warehouseAreaSquareFeet?: number;
  taxAmount?: string;
}

/*
Improvement
APN	
Building #
Section #
Year Built
Gross Building Area (SF)
Office Area (SF)
Warehouse Area (SF)
Storage Area (SF)
Comments
*/

export type SheetParcelImprovement = {
  APN: string;
  buildingNumber: string;
  sectionNumber: string;
  yearBuilt?: number;
  grossBuildingAreaSquareFeet?: number;
  officeAreaSquareFeet?: number;
  warehouseAreaSquareFeet?: number;
  storageAreaSquareFeet?: number;
  comments?: string;
}

/*
Sale



*/

export type SheetSale = {
    address: string;
    saleDate?: string;
    salePrice?: number | string;
    saleTerms?: string;
    grantor?: string;
    grantee?: string;
    instrumentNumber?: string;
    mlsNumber?: string;
    parcels?: SheetParcel[];
    improvements?: SheetParcelImprovement[];
}




