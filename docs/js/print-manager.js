/**
 * Print Manager Module
 * Handles printer detection and certificate printing
 */

class PrintManager {
    constructor() {
        this.availablePrinters = [];
        this.selectedPrinter = null;
    }

    /**
     * Get list of available printers
     * Note: Browser security restrictions limit printer detection
     * @returns {Promise<string[]>}
     */
    async getAvailablePrinters() {
        try {
            // Modern browsers don't allow direct printer enumeration for security reasons
            // We'll simulate common printers or use browser's print dialog
            this.availablePrinters = await this.simulatePrinterDetection();
            return this.availablePrinters;
        } catch (error) {
            console.error('Error getting printers:', error);
            return ['Browser Default Printer'];
        }
    }

    /**
     * Simulate printer detection (since browsers can't directly access printers)
     * @returns {Promise<string[]>}
     */
    async simulatePrinterDetection() {
        // In a real browser environment, we can't enumerate printers
        // This is a simulation of what common printers might be available
        const commonPrinters = [
            'Browser Default Printer',
            'Microsoft Print to PDF',
            'HP LaserJet',
            'Canon PIXMA',
            'Epson WorkForce',
            'Brother MFC'
        ];

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        return commonPrinters;
    }

    /**
     * Print a single PDF certificate
     * @param {Uint8Array} pdfBytes 
     * @param {string} filename 
     * @param {string} printerName 
     * @returns {Promise<boolean>}
     */
    async printCertificate(pdfBytes, filename, printerName = null) {
        try {
            // Create blob URL for the PDF
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Open in new window for printing
            const printWindow = window.open(url, '_blank');
            
            if (printWindow) {
                printWindow.onload = () => {
                    // Give the PDF time to load before printing
                    setTimeout(() => {
                        printWindow.print();
                    }, 1000);
                };
                return true;
            } else {
                throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
            }
        } catch (error) {
            console.error('Error printing certificate:', error);
            throw error;
        }
    }

    /**
     * Print multiple certificates
     * @param {Object[]} certificates 
     * @param {string} printerName 
     * @param {Function} progressCallback 
     * @returns {Promise<Object>}
     */
    async printMultipleCertificates(certificates, printerName = null, progressCallback = null) {
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };

        const successfulCerts = certificates.filter(cert => cert.success);
        
        for (let i = 0; i < successfulCerts.length; i++) {
            const cert = successfulCerts[i];
            
            try {
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: successfulCerts.length,
                        student: cert.studentName,
                        percentage: Math.round(((i + 1) / successfulCerts.length) * 100)
                    });
                }

                await this.printCertificate(cert.pdfBytes, cert.filename, printerName);
                results.successful++;

                // Delay between prints to avoid overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error printing certificate for ${cert.studentName}:`, error);
                results.failed++;
                results.errors.push({
                    student: cert.studentName,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Show browser print dialog for a certificate
     * @param {Uint8Array} pdfBytes 
     * @param {string} filename 
     * @returns {Promise<void>}
     */
    async showPrintDialog(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Create iframe to load PDF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
            try {
                iframe.contentWindow.print();
            } catch (error) {
                // Fallback: open in new window
                const printWindow = window.open(url, '_blank');
                if (printWindow) {
                    printWindow.print();
                }
            }
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
            }, 1000);
        };
    }

    /**
     * Print all certificates with user confirmation
     * @param {Object[]} certificates 
     * @returns {Promise<boolean>}
     */
    async printAllCertificates(certificates) {
        const successfulCerts = certificates.filter(cert => cert.success);
        
        if (successfulCerts.length === 0) {
            alert('No certificates available to print.');
            return false;
        }

        const confirmMessage = `Print ${successfulCerts.length} certificates?\n\n` +
                             'Note: Each certificate will open in a new tab for printing. ' +
                             'Please ensure your browser allows pop-ups.';
        
        if (!confirm(confirmMessage)) {
            return false;
        }

        let printedCount = 0;
        
        for (const cert of successfulCerts) {
            try {
                await this.printCertificate(cert.pdfBytes, cert.filename);
                printedCount++;
                
                // Small delay between opening windows
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Failed to print certificate for ${cert.studentName}:`, error);
                
                const continueMessage = `Failed to print certificate for ${cert.studentName}.\n` +
                                      `Error: ${error.message}\n\n` +
                                      'Continue with remaining certificates?';
                
                if (!confirm(continueMessage)) {
                    break;
                }
            }
        }

        if (printedCount > 0) {
            alert(`Successfully sent ${printedCount} certificates to printer.`);
        }

        return printedCount > 0;
    }

    /**
     * Check if printing is supported
     * @returns {boolean}
     */
    isPrintingSupported() {
        return typeof window.print !== 'undefined';
    }

    /**
     * Get printing capabilities info
     * @returns {Object}
     */
    getPrintingInfo() {
        return {
            supported: this.isPrintingSupported(),
            limitations: [
                'Browser security restrictions prevent direct printer enumeration',
                'Each certificate will open in a new tab/window for printing',
                'Pop-up blocker must be disabled for this site',
                'Actual printing depends on browser print dialog'
            ],
            recommendations: [
                'Allow pop-ups for this site',
                'Set up your default printer before printing',
                'Consider downloading certificates and printing from a PDF viewer for better control'
            ]
        };
    }

    /**
     * Create a print-friendly summary page
     * @param {Object[]} certificates 
     * @returns {string}
     */
    createPrintSummary(certificates) {
        const successful = certificates.filter(cert => cert.success);
        const failed = certificates.filter(cert => !cert.success);

        let html = `
            <html>
            <head>
                <title>Certificate Print Summary</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary-box { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
                    .success { border-left: 4px solid #28a745; }
                    .error { border-left: 4px solid #dc3545; }
                    .student-list { column-count: 2; column-gap: 30px; }
                    .student-item { break-inside: avoid; margin-bottom: 5px; }
                    @media print { 
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Certificate Print Summary</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="summary-box success">
                    <h2>Successfully Generated: ${successful.length}</h2>
                    <div class="student-list">
                        ${successful.map(cert => `<div class="student-item">• ${cert.studentName}</div>`).join('')}
                    </div>
                </div>
                
                ${failed.length > 0 ? `
                <div class="summary-box error">
                    <h2>Failed to Generate: ${failed.length}</h2>
                    <div class="student-list">
                        ${failed.map(cert => `<div class="student-item">• ${cert.studentName}: ${cert.error}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="no-print">
                    <button onclick="window.print()">Print This Summary</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `;

        return html;
    }

    /**
     * Show print summary in new window
     * @param {Object[]} certificates 
     */
    showPrintSummary(certificates) {
        const html = this.createPrintSummary(certificates);
        const summaryWindow = window.open('', '_blank');
        
        if (summaryWindow) {
            summaryWindow.document.write(html);
            summaryWindow.document.close();
        } else {
            alert('Pop-up blocked. Please allow pop-ups to view print summary.');
        }
    }
}

// Export for use in other modules
window.PrintManager = PrintManager;