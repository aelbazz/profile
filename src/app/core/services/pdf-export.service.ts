import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  constructor() {}

  /**
   * Export a DOM element to PDF
   * @param elementId The ID of the element to export
   * @param fileName The name of the output PDF file
   */
  async exportToPdf(elementId: string, fileName: string = 'profile.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    
    if (!element) {
      console.error(`Element with ID "${elementId}" not found`);
      return;
    }

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Slide the same image up by one page height per page. Rounding guards against
      // a trailing blank page when the content divides almost exactly into A4 pages.
      const pageCount = Math.max(1, Math.ceil((imgHeight - 0.01) / pageHeight));

      for (let page = 0; page < pageCount; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        pdf.addImage(contentDataURL, 'PNG', 0, -page * pageHeight, imgWidth, imgHeight);
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Export profile section to PDF
   * Convenience method for exporting the profile section
   */
  async exportProfile(): Promise<void> {
    await this.exportToPdf('profile-export', 'my-profile.pdf');
  }
}

