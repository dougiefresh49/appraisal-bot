```ts
import { readFileSync } from 'fs';
// import { Document, Packer, TextRun } from 'docx';
import * as docx from 'docx';
// import { IPropertiesOptions } from 'docx';

// NOTE: This function is not currently being used -- doesnt work for some reason
async function updateDocxStyles(docxPath: string) {
  const docBuffer = readFileSync(docxPath);
  const doc = new docx.Document(docBuffer as any);

  // const doc = docx.Document.load(readFileSync(docxPath));

  // doc.paragraphs.forEach((paragraph) => {
  //   paragraph.children.forEach((run) => {
  //     if (run instanceof docx.TextRun) {
  //       run.font = 'Arial';
  //       run.size = 22; // 11 pt
  //     }
  //   });
  //   paragraph.spacing = { line: 276 }; // 1.15 line height
  // });

  // // Update heading styles to font size 12
  // doc.paragraphs.forEach((paragraph) => {
  //   if (paragraph.style && paragraph.style.startsWith('Heading')) {
  //     paragraph.children.forEach((run) => {
  //       if (run instanceof docx.TextRun) {
  //         run.font = 'Arial';
  //         run.size = 24; // 12 pt
  //         run.bold = true;
  //       }
  //     });
  //     paragraph.spacing = { line: 276 }; // 1.15 line height
  //   }
  // });

  // @ts-ignore
  doc.sections[0].paragraphs.forEach((paragraph) => {
    if (paragraph.heading) {
      paragraph.text.forEach((run) => {
        // @ts-ignore
        run.font.size = docx.Measurement.pt(12);
        run.font.name = 'Arial';
      });
    } else {
      paragraph.text.forEach((run) => {
        // @ts-ignore
        run.font.size = docx.Measurement.pt(11);
        run.font.name = 'Arial';
        run.font.spacing = 0.15; // Adjust line height, 0.15 in is roughly 1.15 line spacing
      });
    }
  });

  const updatedBuffer = await docx.Packer.toBuffer(doc);
  await fs.writeFile(docxPath, updatedBuffer);

  console.log(`[INFO] ✅ Updated styles in ${docxPath}`);
}
```
