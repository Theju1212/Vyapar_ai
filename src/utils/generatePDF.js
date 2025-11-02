import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generateAIPDF = (aiData, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      // Stream to file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Title
      doc.fontSize(20).text('AI Suggestions & Insights', { align: 'center' });
      doc.moveDown();

      // Alerts Section
      doc.fontSize(16).fillColor('red').text('⚠️ Alerts:', { underline: true });
      aiData.alerts?.forEach((alert, i) => {
        doc.fontSize(12).fillColor('black').text(`${i + 1}. ${alert}`);
      });
      doc.moveDown();

      // Discount Suggestions
      doc.fillColor('green').fontSize(16).text('💰 Discount Suggestions:', { underline: true });
      aiData.discountSuggestions?.forEach((disc, i) => {
        doc.fontSize(12).fillColor('black').text(`${i + 1}. ${disc}`);
      });
      doc.moveDown();

      // Insights Section
      doc.fillColor('blue').fontSize(16).text('📊 Insights:', { underline: true });
      doc.fontSize(12).fillColor('black').text(aiData.insights || 'No insights available.');
      
      // Finalize PDF
      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
};
