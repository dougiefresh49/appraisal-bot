from docx import Document

# File paths
template_path = "/Users/dougiefresh/Dropbox/Appraisals/report-templates/land-report-template.docx"
updated_path = "/Users/dougiefresh/Dropbox/Appraisals/report-templates/land-report-template2.docx"

# Mapping of camelCase variables to new dot-notation variables
variable_mapping = {
    "{{subjectLocation}}": "{{subject.address}}",
    "{{subjectAddress}}": "{{subject.address}}",
    "{{clientFullName}}": "{{client.fullName}}",
    "{{subjectFloodMapDate}}": "{{subject.floodMap.date}}",
    "{{salesCompLocationAnalysisVerbose}}": "{{salesComparison.analysis.location}}",
    "{{subjectSizeSf}}": "{{subject.size.squareFeet}}",
    "{{subjectLegalDescription}}": "{{subject.legalDescription}}",
    "{{subjectOwnershipSalesHistoryVerbose}}": "{{subject.analysis.ownershipSalesHistory}}",
    "{{subjectUtilsProvidElectricity}}": "{{subject.utilities.electricity}}",
    "{{clientAddressCityStZip}}": "{{client.address.cityStateZip}}",
    "{{subjectValueEstimate}}": "{{subject.valueEstimate}}",
    "{{salesComparisonIntroBlurb}}": "{{salesComparison.introduction}}",
    "{{compSalesList}}": "{{salesComparison.list}}",
    "{{salesCompDateOfSaleVerbose}}": "{{salesComparison.analysis.dateOfSale.description}}",
    "{{subjectEasementsEncroachmentsVerbose}}": "{{subject.analysis.easements}}",
    "{{subjectSizeAndConfigVerbose}}": "{{subject.analysis.sizeAndConfig}}",
    "{{subjectNeighborhoodDescriptionVerbose}}": "{{subject.neighborhood.description}}",
    "{{subjectFloodMapImage}}": "{{subject.floodMap.image}}",
    "{{neighborhoodPimaryUseShort}}": "{{subject.neighborhood.primaryUse}}",
    "{{subjectFrontAndAccessibilityVerbose}}": "{{subject.analysis.frontageAndAccessibility}}",
    "{{subjectPropertyDevelopmentVerbose}}": "{{subject.analysis.propertyDevelopment}}",
    "{{subjectZoningMapImage}}": "{{subject.zoning.map}}",
    "{{subjectUtilsProvidProtection}}": "{{subject.utilities.protection}}",
    "{{subjectZoning}}": "{{subject.zoning.description}}",
    "{{salesCompAnalysisOfSalesVerbose}}": "{{salesComparison.analysis.summary}}",
    "{{reportDate}}": "{{report.date}}",
    "{{appraisalDate}}": "{{report.appraisalDate}}",
    "{{subjectUtilsProvidWater}}": "{{subject.utilities.water}}",
    "{{subjectFrontageVerbose}}": "{{subject.analysis.frontageAndAccessibility}}",
    "{{addendaAttachmentEngContractImage}}": "{{addenda.engagementContract}}",
    "{{subjectSizeAc}}": "{{subject.size.acres}}",
    "{{subjectUtilsProvidGas}}": "{{subject.utilities.gas}}",
    "{{salesCompDateOfSaleAdjustmentVerbose}}": "{{salesComparison.analysis.dateOfSale.adjustments}}",
    "{{subjectUtilsProvidPhone}}": "{{subject.utilities.phone}}",
    "{{clientFirstName}}": "{{client.firstName}}",
    "{{subjectUtilsProvidSewer}}": "{{subject.utilities.sewer}}",
    "{{clientAddressStreet}}": "{{client.address.street}}",
    "{{subjectAdValoremTaxesVerbose}}": "{{subject.adValoremTaxes}}",
    "{{subjectSurveyImage}}": "{{subject.surveyImage}}",
    "{{subjectFemaFloodMapImage}}": "{{subject.floodMap.femaImage}}",
    "{{comparableSalesMapImage}}": "{{salesComparison.map.image}}",
    "{{salesCompSizeAnalysisVerbose}}": "{{salesComparison.analysis.size}}",
    "{{subjectFloodMapNumber}}": "{{subject.floodMap.number}}",
    "{{subjectNeighborhoodMapImage}}": "{{subject.neighborhood.map}}",
    "{{subjectFloodMapDescription}}": "{{subject.floodMap.description}}",
    "{{subjectHighestBestUse}}": "{{subject.highestBestUse}}"
}

# Open the Word document
doc = Document(template_path)

# Replace variables in the document
for paragraph in doc.paragraphs:
    for old_var, new_var in variable_mapping.items():
        if old_var in paragraph.text:
            paragraph.text = paragraph.text.replace(old_var, new_var)

# Save the updated document
doc.save(updated_path)

print(f"Updated template saved at: {updated_path}")
