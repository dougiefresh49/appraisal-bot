// import { GoogleGenerativeAI } from '@google/generative-ai';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// import * as canvas from 'canvas';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { getProjectArgs } from '../utils/project-args';

// pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
//   'pdfjs-dist/legacy/build/pdf.worker.mjs'
// );

// const { dataPathRoot } = getProjectArgs();
// const API_KEY = process.env.GEMINI_API_KEY!;
// const PDF_FILE_PATH = path.join(
//   dataPathRoot,
//   'deeds-and-sales/2012-00018580.pdf'
// );
// const MODEL_ID = 'gemini-1.5-pro-002'; // Or your preferred model

// const genAI = new GoogleGenerativeAI(API_KEY);

// async function convertPdfPageToPngBase64(
//   pdfDocument: pdfjsLib.PDFDocumentProxy,
//   pageNumber: number
// ): Promise<string> {
//   // ... (same as before) ...
//   const page = await pdfDocument.getPage(pageNumber);
//   const viewport = page.getViewport({ scale: 2.0 });
//   const canvasInstance = new canvas.Canvas(viewport.width, viewport.height);
//   const context = canvasInstance.getContext('2d') as any; //Type assertion to any
//   const renderContext = {
//     canvasContext: context as any,
//     viewport: viewport,
//   };
//   await page.render(renderContext).promise;
//   const pngBuffer = canvasInstance.toBuffer('image/png');
//   return Buffer.from(pngBuffer).toString('base64');
// }

// async function extractLotNumbersFromImages(
//   pdfFilePath: string
// ): Promise<string[]> {
//   try {
//     const pdfData: Buffer = await fs.readFile(pdfFilePath); // Read as Buffer
//     const uint8Array = new Uint8Array(pdfData.buffer); // *** Convert to Uint8Array ***

//     const loadingTask = pdfjsLib.getDocument({ data: uint8Array }); // Pass Uint8Array
//     const pdfDocument = await loadingTask.promise;
//     const numPages = pdfDocument.numPages;

//     const imageParts: { inlineData: { data: string; mimeType: string } }[] = [];
//     for (let i = 1; i <= numPages; i++) {
//       const pageBase64 = await convertPdfPageToPngBase64(pdfDocument, i);
//       imageParts.push({
//         inlineData: {
//           data: pageBase64,
//           mimeType: 'image/png',
//         },
//       });
//     }

//     const prompt = `Extract all the lot numbers...`;

//     const model = genAI.getGenerativeModel({ model: MODEL_ID });
//     const result = await model.generateContent([prompt, ...imageParts]);
//     const response = result.response;
//     const extractedText = response.text();

//     return extractedText
//       ? extractedText
//           .split(',')
//           .map((s) => s.trim())
//           .filter((s) => s)
//       : [];
//   } catch (error) {
//     console.error('Error:', error);
//     throw error;
//   }
// }
// // Main Execution
// (async () => {
//   try {
//     const lots = await extractLotNumbersFromImages(PDF_FILE_PATH);
//     console.log(lots);
//   } catch (error) {
//     console.error(error);
//   }
// })();
