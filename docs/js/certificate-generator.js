/**
 * Certificate Generator Module
 * Handles PDF generation using pdf-lib
 */

class CertificateGenerator {
    constructor() {
        // Certificate positioning (calibrated for JA Certificate E004)
        this.positions = {
            studentName: { x: 500, y: 480, font: 'Helvetica-Bold', size: 18 },
            schoolName: { x: 500, y: 253, font: 'Helvetica', size: 14 },
            date: { x: 500, y: 109, font: 'Helvetica', size: 12 },
            jaVolunteer: { x: 380, y: 182, font: 'Times-Italic', size: 14 },
            teacher: { x: 645, y: 182, font: 'Times-Italic', size: 14 }
        };
        
        this.templateBuffer = null;
    }

    /**
     * Load the certificate template
     * @returns {Promise<void>}
     */
    async loadTemplate() {
        try {
            // For GitHub Pages, we'll include a template or let users upload one
            // For now, we'll create a basic template
            const response = await fetch('assets/certificate-template.pdf');
            if (!response.ok) {
                // If template doesn't exist, create a basic one
                this.templateBuffer = await this.createBasicTemplate();
            } else {
                this.templateBuffer = await response.arrayBuffer();
            }
        } catch (error) {
            console.log('Creating basic template since no template file found');
            this.templateBuffer = await this.createBasicTemplate();
        }
    }

    /**
     * Create a basic certificate template
     * @returns {Promise<ArrayBuffer>}
     */
    async createBasicTemplate() {
        const pdfDoc = await PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage([792, 612]); // Letter size landscape
        
        // Draw border
        page.drawRectangle({
            x: 50,
            y: 50,
            width: 692,
            height: 512,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 3
        });
        
        // Inner border
        page.drawRectangle({
            x: 70,
            y: 70,
            width: 652,
            height: 472,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 1
        });

        // Title
        page.drawText('Certificate of Achievement', {
            x: 180,
            y: 450,
            size: 36,
            color: PDFLib.rgb(0, 0, 0.5)
        });

        // "This certifies that"
        page.drawText('This certifies that', {
            x: 300,
            y: 400,
            size: 16,
            color: PDFLib.rgb(0, 0, 0)
        });

        // Student name placeholder
        page.drawLine({
            start: { x: 200, y: 350 },
            end: { x: 592, y: 350 },
            thickness: 2,
            color: PDFLib.rgb(0, 0, 0)
        });

        // Achievement text
        page.drawText('has successfully completed the Junior Achievement program', {
            x: 180,
            y: 310,
            size: 14,
            color: PDFLib.rgb(0, 0, 0)
        });

        // School placeholder
        page.drawText('at', {
            x: 350,
            y: 280,
            size: 14,
            color: PDFLib.rgb(0, 0, 0)
        });

        page.drawLine({
            x: 200,
            y: 250,
            width: 392,
            height: 1,
            color: PDFLib.rgb(0, 0, 0)
        });

        // Signature lines
        page.drawText('JA Volunteer:', {
            x: 150,
            y: 180,
            size: 12,
            color: PDFLib.rgb(0, 0, 0)
        });

        page.drawLine({
            start: { x: 250, y: 175 },
            end: { x: 450, y: 175 },
            thickness: 1,
            color: PDFLib.rgb(0, 0, 0)
        });

        page.drawText('Teacher:', {
            x: 500,
            y: 180,
            size: 12,
            color: PDFLib.rgb(0, 0, 0)
        });

        page.drawLine({
            start: { x: 560, y: 175 },
            end: { x: 700, y: 175 },
            thickness: 1,
            color: PDFLib.rgb(0, 0, 0)
        });

        // Date line
        page.drawText('Date:', {
            x: 350,
            y: 120,
            size: 12,
            color: PDFLib.rgb(0, 0, 0)
        });

        page.drawLine({
            start: { x: 400, y: 115 },
            end: { x: 550, y: 115 },
            thickness: 1,
            color: PDFLib.rgb(0, 0, 0)
        });

        return await pdfDoc.save();
    }

    /**
     * Generate a single certificate
     * @param {string} studentName 
     * @param {Object} certificateInfo 
     * @returns {Promise<Uint8Array>}
     */
    async generateCertificate(studentName, certificateInfo) {
        try {
            if (!this.templateBuffer) {
                await this.loadTemplate();
            }

            const pdfDoc = await PDFLib.PDFDocument.load(this.templateBuffer);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            
            // Get page dimensions
            const { width, height } = firstPage.getSize();

            // Student name
            await this.addText(firstPage, studentName, this.positions.studentName, width);

            // School name
            if (certificateInfo.schoolName) {
                await this.addText(firstPage, certificateInfo.schoolName, this.positions.schoolName, width);
            }

            // Date
            if (certificateInfo.date) {
                const formattedDate = this.formatDate(certificateInfo.date);
                await this.addText(firstPage, formattedDate, this.positions.date, width);
            }

            // JA Volunteer
            if (certificateInfo.jaVolunteer) {
                await this.addText(firstPage, certificateInfo.jaVolunteer, this.positions.jaVolunteer, width);
            }

            // Teacher
            if (certificateInfo.teacher) {
                await this.addText(firstPage, certificateInfo.teacher, this.positions.teacher, width);
            }

            return await pdfDoc.save();
        } catch (error) {
            console.error('Error generating certificate:', error);
            throw new Error(`Failed to generate certificate for ${studentName}: ${error.message}`);
        }
    }

    /**
     * Add text to a page with proper positioning
     * @param {PDFPage} page 
     * @param {string} text 
     * @param {Object} position 
     * @param {number} pageWidth 
     */
    async addText(page, text, position, pageWidth) {
        const textWidth = this.getTextWidth(text, position.font, position.size);
        const centeredX = position.x - (textWidth / 2);

        page.drawText(text, {
            x: Math.max(50, Math.min(centeredX, pageWidth - textWidth - 50)), // Keep within margins
            y: position.y,
            size: position.size,
            color: PDFLib.rgb(0, 0, 0)
        });
    }

    /**
     * Estimate text width (simplified calculation)
     * @param {string} text 
     * @param {string} font 
     * @param {number} size 
     * @returns {number}
     */
    getTextWidth(text, font, size) {
        // Simple approximation - in production, you'd use more accurate font metrics
        const averageCharWidth = size * 0.6; // Approximate for most fonts
        return text.length * averageCharWidth;
    }

    /**
     * Format date for display
     * @param {string} dateString 
     * @returns {string}
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Generate bulk certificates
     * @param {string[]} studentNames 
     * @param {Object} certificateInfo 
     * @param {Function} progressCallback 
     * @returns {Promise<Object[]>}
     */
    async generateBulkCertificates(studentNames, certificateInfo, progressCallback = null) {
        const certificates = [];
        const total = studentNames.length;

        for (let i = 0; i < total; i++) {
            const studentName = studentNames[i];
            
            try {
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: total,
                        student: studentName,
                        percentage: Math.round(((i + 1) / total) * 100)
                    });
                }

                const pdfBytes = await this.generateCertificate(studentName, certificateInfo);
                
                certificates.push({
                    studentName: studentName,
                    filename: this.createSafeFilename(studentName),
                    pdfBytes: pdfBytes,
                    success: true
                });

                // Small delay to prevent browser from freezing
                await new Promise(resolve => setTimeout(resolve, 10));

            } catch (error) {
                console.error(`Error generating certificate for ${studentName}:`, error);
                certificates.push({
                    studentName: studentName,
                    filename: this.createSafeFilename(studentName),
                    error: error.message,
                    success: false
                });
            }
        }

        return certificates;
    }

    /**
     * Create safe filename from student name
     * @param {string} studentName 
     * @returns {string}
     */
    createSafeFilename(studentName) {
        return studentName
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase() + '_certificate.pdf';
    }

    /**
     * Create a ZIP file with all certificates
     * @param {Object[]} certificates 
     * @returns {Promise<Blob>}
     */
    async createZipFile(certificates) {
        const zip = new JSZip();
        
        const successfulCerts = certificates.filter(cert => cert.success);
        
        for (const cert of successfulCerts) {
            zip.file(cert.filename, cert.pdfBytes);
        }

        // Add a summary file
        const summary = this.createSummaryText(certificates);
        zip.file('certificate_summary.txt', summary);

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Create summary text for the certificate batch
     * @param {Object[]} certificates 
     * @returns {string}
     */
    createSummaryText(certificates) {
        const successful = certificates.filter(cert => cert.success);
        const failed = certificates.filter(cert => !cert.success);

        let summary = `Certificate Generation Summary\n`;
        summary += `Generated on: ${new Date().toLocaleString()}\n\n`;
        summary += `Total certificates requested: ${certificates.length}\n`;
        summary += `Successfully generated: ${successful.length}\n`;
        summary += `Failed: ${failed.length}\n\n`;

        if (successful.length > 0) {
            summary += `Successfully Generated:\n`;
            summary += `${'-'.repeat(30)}\n`;
            successful.forEach(cert => {
                summary += `• ${cert.studentName}\n`;
            });
            summary += '\n';
        }

        if (failed.length > 0) {
            summary += `Failed to Generate:\n`;
            summary += `${'-'.repeat(30)}\n`;
            failed.forEach(cert => {
                summary += `• ${cert.studentName}: ${cert.error}\n`;
            });
        }

        return summary;
    }

    /**
     * Download individual certificate
     * @param {Object} certificate 
     */
    downloadCertificate(certificate) {
        if (!certificate.success) {
            console.error('Cannot download failed certificate:', certificate.error);
            return;
        }

        const blob = new Blob([certificate.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = certificate.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Download ZIP file
     * @param {Blob} zipBlob 
     * @param {string} filename 
     */
    downloadZip(zipBlob, filename = 'certificates.zip') {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
window.CertificateGenerator = CertificateGenerator;