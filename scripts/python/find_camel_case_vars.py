from docx import Document
import re

# Path to the Word document
template_path = "/Users/dougiefresh/Dropbox/Appraisals/report-templates/land-report-template2.docx"

# Regular expression to match template variables
variable_pattern = r"{{\s*([\w]+)\s*}}"  # Matches variables like {{variableName}}

# Function to identify camelCase variables
def is_camel_case(variable):
    return variable[0].islower() and any(c.isupper() for c in variable)

# Open the Word document
doc = Document(template_path)

# Extract variables
found_variables = set()  # Use a set to avoid duplicates
for paragraph in doc.paragraphs:
    matches = re.findall(variable_pattern, paragraph.text)
    for match in matches:
        found_variables.add(match)

# Filter camelCase variables
camel_case_variables = [var for var in found_variables if is_camel_case(var)]

# Print the results
print("CamelCase Variables (old format):")
for var in camel_case_variables:
    print(var)
