/**
 * Print Manager Module
 * Handles printer detection and certificate printing
 */

class PrintManager {
    constructor() {
        this.availablePrinters = [];
        this.selectedPrinter = null;
        
        // Check if PDF-lib is available for combining PDFs
        this.canCombinePdfs = !!window.PDFLib;
        if (!this.canCombinePdfs) {
            console.warn('PDF-lib not available - combined printing will be limited');
        }
    }

    /**
     * Get list of available printers
     * Note: Browser security restrictions limit printer detection
     * @returns {Promise<string[]>}
     */
    async getAvailablePrinters() {
        try {
            // Modern browsers don't allow direct printer enumeration for security reasons
            // We'll use window.print() which gives access to actual local printers
            this.availablePrinters = ['Use Browser Print Dialog (Recommended)', 'Print All Individually'];
            return this.availablePrinters;
        } catch (error) {
            console.error('Error getting printers:', error);
            return ['Use Browser Print Dialog'];
        }
    }

    /**
     * Simulate printer detection (since browsers can't directly access printers)
     * @returns {Promise<string[]>}
     */
    async simulatePrinterDetection() {
        // Return options that use window.print() for real printer access
        return ['Use Browser Print Dialog (Recommended)', 'Print All Individually'];
    }

    /**
     * Print a single PDF certificate using window.print()
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

            // Create a hidden iframe to load the PDF
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.src = url;

            // Add iframe to document
            document.body.appendChild(iframe);

            return new Promise((resolve, reject) => {
                iframe.onload = () => {
                    try {
                        // Wait a moment for PDF to fully load
                        setTimeout(() => {
                            // Use the iframe's contentWindow to trigger print
                            if (iframe.contentWindow) {
                                iframe.contentWindow.print();
                            } else {
                                // Fallback: print the current window (less ideal)
                                window.print();
                            }

                            // Clean up after a delay
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                                URL.revokeObjectURL(url);
                            }, 1000);

                            resolve(true);
                        }, 1000);
                    } catch (error) {
                        console.error('Error printing:', error);
                        // Clean up on error
                        document.body.removeChild(iframe);
                        URL.revokeObjectURL(url);
                        reject(error);
                    }
                };

                iframe.onerror = (error) => {
                    console.error('Error loading PDF for printing:', error);
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load PDF for printing'));
                };
            });

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

        // Check if combined printing is available
        if (!this.canCombinePdfs) {
            const message = `PDF combining library not available.\n\n` +
                          `Certificates will be printed individually.\n` +
                          `Each certificate will open a separate print dialog.\n\n` +
                          `Continue with individual printing?`;
            
            if (confirm(message)) {
                return await this.printAllIndividually(successfulCerts);
            }
            return false;
        }

        // Show options for printing if PDF-lib is available
        const printOption = this.showPrintOptions(successfulCerts.length);
        
        if (printOption === 'cancel') {
            return false;
        } else if (printOption === 'combined') {
            return await this.printAllCombined(successfulCerts);
        } else if (printOption === 'individual') {
            return await this.printAllIndividually(successfulCerts);
        }

        return false;
    }

    /**
     * Show print options dialog
     * @param {number} certCount 
     * @returns {string}
     */
    showPrintOptions(certCount) {
        const message = `How would you like to print ${certCount} certificates?\n\n` +
                       `Option 1: Print All Together (RECOMMENDED)\n` +
                       `• Combines all certificates into one PDF document\n` +
                       `• Single print job with one printer selection\n` +
                       `• Faster and easier to manage\n` +
                       `• Best for printing to the same printer\n\n` +
                       `Option 2: Print One by One\n` +
                       `• Each certificate opens a separate print dialog\n` +
                       `• Individual printer selection for each certificate\n` +
                       `• More control but takes longer\n` +
                       `• Good if you need different settings per certificate\n\n` +
                       `Option 3: Cancel printing`;

        const choice = prompt(message + '\n\nEnter 1, 2, or 3:', '1');
        
        switch (choice) {
            case '1': return 'combined';
            case '2': return 'individual';
            case '3': 
            case null: // User clicked Cancel
            default: return 'cancel';
        }
    }

    /**
     * Print all certificates combined in one document
     * @param {Object[]} certificates 
     * @param {Function} progressCallback Optional progress callback
     * @returns {Promise<boolean>}
     */
    async printAllCombined(certificates, progressCallback = null) {
        try {
            // Show initial progress
            if (progressCallback) {
                progressCallback({
                    message: 'Starting PDF combination...',
                    current: 0,
                    total: certificates.length
                });
            }
            
            // Create a combined PDF with all certificates
            const combinedPdf = await this.createCombinedPdf(certificates, progressCallback);
            
            // Show final progress
            if (progressCallback) {
                progressCallback({
                    message: 'Combined PDF ready for printing!',
                    current: certificates.length,
                    total: certificates.length
                });
            }
            
            // Show success message before printing
            const printMsg = `Combined PDF created successfully!\n\n` +
                           `• ${certificates.length} certificates combined\n` +
                           `• Total pages: ${certificates.length}\n` +
                           `• Ready to print\n\n` +
                           `The print dialog will now open. Select your printer and print settings.`;
            
            alert(printMsg);
            
            // Print the combined PDF
            await this.printCertificate(combinedPdf, 'all-certificates.pdf');
            
            return true;
            
        } catch (error) {
            console.error('Error printing combined certificates:', error);
            
            // Show user-friendly error with fallback option
            const errorMsg = `Error creating combined PDF: ${error.message}\n\n` +
                           `Would you like to try printing certificates individually instead?`;
            
            if (confirm(errorMsg)) {
                return await this.printAllIndividually(certificates);
            }
            
            return false;
        }
    }

    /**
     * Create a combined PDF with all certificates
     * @param {Object[]} certificates 
     * @param {Function} progressCallback Optional progress callback
     * @returns {Promise<Uint8Array>}
     */
    async createCombinedPdf(certificates, progressCallback = null) {
        try {
            console.log(`Creating combined PDF with ${certificates.length} certificates...`);
            
            if (!window.PDFLib) {
                throw new Error('PDF-lib not available for combining PDFs');
            }

            // Create a new PDF document for the combined output
            const combinedPdf = await PDFLib.PDFDocument.create();

            for (let i = 0; i < certificates.length; i++) {
                const cert = certificates[i];
                console.log(`Adding certificate ${i + 1}: ${cert.studentName}`);

                // Update progress
                if (progressCallback) {
                    progressCallback({
                        message: `Adding certificate for ${cert.studentName}...`,
                        current: i + 1,
                        total: certificates.length
                    });
                }

                try {
                    // Load the individual certificate PDF
                    const certPdf = await PDFLib.PDFDocument.load(cert.pdfBytes);
                    
                    // Copy all pages from the certificate to the combined PDF
                    const pages = await combinedPdf.copyPages(certPdf, certPdf.getPageIndices());
                    
                    // Add each page to the combined document
                    pages.forEach(page => combinedPdf.addPage(page));
                    
                } catch (error) {
                    console.error(`Error adding certificate for ${cert.studentName}:`, error);
                    // Continue with other certificates even if one fails
                }

                // Small delay to prevent blocking the UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            console.log('Combined PDF created successfully');
            
            // Final progress update
            if (progressCallback) {
                progressCallback({
                    message: 'Saving combined PDF...',
                    current: certificates.length,
                    total: certificates.length
                });
            }
            
            return await combinedPdf.save();
            
        } catch (error) {
            console.error('Error creating combined PDF:', error);
            throw new Error(`Failed to create combined PDF: ${error.message}`);
        }
    }

    /**
     * Print all certificates individually
     * @param {Object[]} certificates 
     * @returns {Promise<boolean>}
     */
    async printAllIndividually(certificates) {
        let printedCount = 0;
        
        const confirmMessage = `Print ${certificates.length} certificates one by one?\n\n` +
                             'Each certificate will open a print dialog. ' +
                             'You can select your printer for each one.\n\n' +
                             'Continue?';
        
        if (!confirm(confirmMessage)) {
            return false;
        }

        for (let i = 0; i < certificates.length; i++) {
            const cert = certificates[i];
            
            try {
                // Show progress
                console.log(`Printing certificate ${i + 1} of ${certificates.length}: ${cert.studentName}`);
                
                await this.printCertificate(cert.pdfBytes, cert.filename);
                printedCount++;
                
                // Small delay between prints
                await new Promise(resolve => setTimeout(resolve, 2000));
                
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
            alert(`Successfully sent ${printedCount} of ${certificates.length} certificates to printer.`);
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
            method: 'Native browser printing with window.print()',
            advantages: [
                'Access to your actual local printers',
                'Use your system\'s print drivers and settings',
                'No browser security restrictions',
                'Full printer selection and configuration',
                'Reliable print quality and formatting'
            ],
            instructions: [
                'Choose your print option from the dropdown',
                'Click "Generate Certificates" and enable printing',
                'Each certificate will open a browser print dialog',
                'Select your desired printer from the list',
                'Adjust print settings as needed',
                'Click Print to send to your printer'
            ],
            tips: [
                'Ensure your printer is connected and turned on',
                'Check that printer drivers are properly installed',
                'Consider printing a test page first',
                'For large batches, ensure sufficient paper supply'
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