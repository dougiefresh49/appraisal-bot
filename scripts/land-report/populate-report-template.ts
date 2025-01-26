import * as fs from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
const expressionParser = require('docxtemplater/expressions.js');
const ImageModule = require('docxtemplater-image-module-free');

interface Sale {
  number: string;
  location: string;
  legalDescription: string;
  dateOfSale: string;
  deedNumber: string;
  mlsNumber: string;
  grantor: string;
  grantee: string;
  consideration: string;
  terms: string;
  pricePerAcre: string;
  size: string;
  zoning: string;
  propertyId: string[];
  comments: string;
  source: string;
}

interface PartOwner {
  name: string;
  shares: string;
  acres: string;
}

interface Data {
  subject: {
    analysis: {
      ownership: {
        partOwners: PartOwner[];
        owners?: string;
      };
    };
  };
  sales: Sale[];
  salesComparison: {
    list?: string;
  };
}

// Paths
const mainTemplatePath = path.resolve(__dirname, 'land-report-template2.docx');
const outputPath = path.resolve(__dirname, 'land-report-output.docx');
const dataPath = path.resolve(__dirname, 'data.json');

// Load the JSON data
let data: Data;
try {
  const jsonData = fs.readFileSync(dataPath, 'utf8');
  data = JSON.parse(jsonData);
  console.log('Data loaded successfully from:', dataPath);
} catch (error) {
  console.error('Error loading JSON data:', error);
  process.exit(1);
}

const imageSizeMap = {
  floodMap: ['11.85cm', '18.75cm'],
  femaFloodMap: ['12.5cm', '16.5cm'],
  zoningMap: ['12.5cm', '19.75cm'],
  neighborhoodMap: ['16.5cm', '11.1cm'],
  locationMap: ['13.4cm', '16.5cm'],
  surveyImage: ['14cm', '19.75cm'],
  subjectImages: ['14cm', '19.75cm'],
  compSaleImage: ['9.7cm', '8.28cm'],
};

// Image module configuration
const imageOptions = {
  // prefix: {
  //   centered: '%',
  //   normal: '%%',
  // },
  centered: true,
  getImage(tagValue: string, tagName: string) {
    try {
      console.log(`Loading image for tag: ${tagName}, from path: ${tagValue}`);
      return fs.readFileSync(tagValue);
    } catch (error) {
      console.error(`Error loading image for tag: ${tagName}`, error.message);
      throw error;
    }
  },
  getSize(img: Buffer, tagValue: string, tagName: string) {
    // Return image size in centimeters
    console.log(`Setting size for tag: ${tagName}`);
    // return ['16cm', '23cm']; // Size in cm as requested
    return [624, 865];
  },
};

// Process the main template
try {
  const mainTemplateContent = fs.readFileSync(mainTemplatePath, 'binary');
  const zip = new PizZip(mainTemplateContent);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: expressionParser,
    modules: [new ImageModule(imageOptions)],
  });

  // Render the document with the updated data
  doc.render(data);

  // Generate the output file
  const buffer = doc.getZip().generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
  console.log('Document populated successfully! Saved to:', outputPath);
} catch (error) {
  console.error('Error populating main document:', error);
}
