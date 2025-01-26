from docx import Document

# File paths
template_path = "/Users/dougiefresh/Dropbox/Appraisals/report-templates/land-sale-single-template.docx"  # Original template with camelCase variables
updated_path = "/Users/dougiefresh/Dropbox/Appraisals/report-templates/land-sale-single-template2.docx"  # Output file with dot-notation variables


# Mapping of camelCase variables to dot-notation variables
variable_mapping = {
    "{{saleNumber}}": "{{sale.number}}",
    "{{location}}": "{{sale.location}}",
    "{{legalDescription}}": "{{sale.legalDescription}}",
    "{{dateOfSale}}": "{{sale.dateOfSale}}",
    "{{deedNumber}}": "{{sale.deedNumber}}",
    "{{mlsNumber}}": "{{sale.mlsNumber}}",
    "{{grantor}}": "{{sale.grantor}}",
    "{{grantee}}": "{{sale.grantee}}",
    "{{consideration}}": "{{sale.consideration}}",
    "{{terms}}": "{{sale.terms}}",
    "{{pricePerAcre}}": "{{sale.pricePerAcre}}",
    "{{propertyId}}": "{{sale.propertyId}}",
    "{{size}}": "{{sale.size}}",
    "{{zoning}}": "{{sale.zoning}}",
    "{{utilities}}": "{{sale.utilities}}",
    "{{roadFrontage}}": "{{sale.roadFrontage}}",
    "{{terrain}}": "{{sale.terrain}}",
    "{{floodPlain}}": "{{sale.floodPlain}}",
    "{{easements}}": "{{sale.easements}}",
    "{{improvements}}": "{{sale.improvements}}",
    "{{comments}}": "{{sale.comments}}",
    "{{source}}": "{{sale.source}}"
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
