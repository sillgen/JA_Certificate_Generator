/**
 * Main Application Controller
 * Coordinates all modules and handles UI interactions
 */

class CertificateApp {
    constructor() {
        this.fileParser = new FileParser();
        this.certificateGenerator = new CertificateGenerator();
        this.printManager = new PrintManager();
        
        this.studentNames = [];
        this.generatedCertificates = [];
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupEventListeners();
        this.setupDateDefault();
        await this.loadPrinters();
        await this.certificateGenerator.loadTemplate();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // File upload
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('studentFile');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        fileUploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Form submission
        const form = document.getElementById('certificateForm');
        form.addEventListener('submit', this.handleFormSubmit.bind(this));

        // Print options
        const enablePrinting = document.getElementById('enablePrinting');
        enablePrinting.addEventListener('change', this.togglePrintSection.bind(this));

        // Refresh printers
        const refreshPrintersBtn = document.getElementById('refreshPrinters');
        refreshPrintersBtn.addEventListener('click', this.loadPrinters.bind(this));

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        previewBtn.addEventListener('click', this.showPreview.bind(this));

        // Modal close
        const closeModal = document.getElementById('closeModal');
        closeModal.addEventListener('click', this.closeModal.bind(this));

        // Results buttons
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        downloadAllBtn.addEventListener('click', this.downloadAllCertificates.bind(this));

        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', this.resetApplication.bind(this));

        // Click outside modal to close
        const modal = document.getElementById('previewModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    /**
     * Set default date to today
     */
    setupDateDefault() {
        const dateInput = document.getElementById('certificateDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    /**
     * Load available printers
     */
    async loadPrinters() {
        const printerSelect = document.getElementById('printerSelect');
        printerSelect.innerHTML = '<option value="">Loading printers...</option>';

        try {
            const printers = await this.printManager.getAvailablePrinters();
            
            printerSelect.innerHTML = '<option value="">Select a printer...</option>';
            printers.forEach(printer => {
                const option = document.createElement('option');
                option.value = printer;
                option.textContent = printer;
                printerSelect.appendChild(option);
            });

            // Select the first printer by default if available
            if (printers.length > 0) {
                printerSelect.value = printers[0];
            }

        } catch (error) {
            console.error('Error loading printers:', error);
            printerSelect.innerHTML = '<option value="">Error loading printers</option>';
        }
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }

    /**
     * Handle file drop event
     */
    async handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    /**
     * Handle file selection from input
     */
    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    /**
     * Process uploaded file
     */
    async processFile(file) {
        try {
            this.showLoading('Processing file...');
            
            const fileNameDiv = document.getElementById('fileName');
            fileNameDiv.innerHTML = `<i class="fas fa-file-alt"></i> ${file.name}`;
            fileNameDiv.classList.remove('hidden');

            // Parse the file
            this.studentNames = await this.fileParser.parseFile(file);
            
            if (this.studentNames.length === 0) {
                throw new Error('No student names found in the file');
            }

            // Show preview of students
            this.displayStudentPreview(this.studentNames);
            this.enableGenerateButton();
            
            this.hideLoading();

        } catch (error) {
            console.error('Error processing file:', error);
            alert(`Error processing file: ${error.message}`);
            this.hideLoading();
        }
    }

    /**
     * Display preview of found student names
     */
    displayStudentPreview(names) {
        const preview = document.getElementById('studentPreview');
        const studentList = document.getElementById('studentList');
        
        studentList.innerHTML = '';
        names.forEach(name => {
            const span = document.createElement('span');
            span.className = 'student-name';
            span.textContent = name;
            studentList.appendChild(span);
        });

        preview.classList.remove('hidden');
    }

    /**
     * Enable the generate button
     */
    enableGenerateButton() {
        const generateBtn = document.getElementById('generateBtn');
        const previewBtn = document.getElementById('previewBtn');
        generateBtn.disabled = false;
        previewBtn.disabled = false;
    }

    /**
     * Toggle print section visibility
     */
    togglePrintSection() {
        const enablePrinting = document.getElementById('enablePrinting');
        const printerSection = document.getElementById('printerSection');
        
        if (enablePrinting.checked) {
            printerSection.classList.remove('hidden');
        } else {
            printerSection.classList.add('hidden');
        }
    }

    /**
     * Show preview of certificates
     */
    async showPreview() {
        if (this.studentNames.length === 0) {
            alert('Please upload a student list first.');
            return;
        }

        const modal = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');

        // Get form data
        const certificateInfo = this.getCertificateInfo();

        // Create preview content
        previewContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h3>Certificate Preview</h3>
                <p><strong>Students:</strong> ${this.studentNames.length}</p>
                <p><strong>School:</strong> ${certificateInfo.schoolName}</p>
                <p><strong>Date:</strong> ${certificateInfo.date ? this.certificateGenerator.formatDate(certificateInfo.date) : 'Not specified'}</p>
                ${certificateInfo.teacher ? `<p><strong>Teacher:</strong> ${certificateInfo.teacher}</p>` : ''}
                ${certificateInfo.jaVolunteer ? `<p><strong>JA Volunteer:</strong> ${certificateInfo.jaVolunteer}</p>` : ''}
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4>Student Names to be Generated:</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${this.studentNames.map((name, index) => `<p>${index + 1}. ${name}</p>`).join('')}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('previewModal');
        modal.classList.add('hidden');
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        if (this.studentNames.length === 0) {
            alert('Please upload a student list first.');
            return;
        }

        try {
            const certificateInfo = this.getCertificateInfo();
            await this.generateCertificates(certificateInfo);
        } catch (error) {
            console.error('Error generating certificates:', error);
            alert(`Error generating certificates: ${error.message}`);
        }
    }

    /**
     * Get certificate information from form
     */
    getCertificateInfo() {
        return {
            schoolName: document.getElementById('schoolName').value.trim(),
            teacherName: document.getElementById('teacherName').value.trim() || null,
            jaVolunteer: document.getElementById('jaVolunteer').value.trim() || null,
            date: document.getElementById('certificateDate').value,
            enablePrinting: document.getElementById('enablePrinting').checked,
            printerName: document.getElementById('printerSelect').value || null
        };
    }

    /**
     * Generate certificates for all students
     */
    async generateCertificates(certificateInfo) {
        this.showProgress();
        
        try {
            this.generatedCertificates = await this.certificateGenerator.generateBulkCertificates(
                this.studentNames,
                certificateInfo,
                this.updateProgress.bind(this)
            );

            this.hideProgress();
            this.showResults();

            // Handle printing if enabled
            if (certificateInfo.enablePrinting) {
                await this.handlePrinting(certificateInfo.printerName);
            }

        } catch (error) {
            this.hideProgress();
            throw error;
        }
    }

    /**
     * Handle printing of generated certificates
     */
    async handlePrinting(printerName) {
        try {
            const printInfo = this.printManager.getPrintingInfo();
            
            const confirmMessage = `Print all certificates?\n\n` +
                                 `Generated: ${this.generatedCertificates.filter(c => c.success).length} certificates\n\n` +
                                 `Note: ${printInfo.limitations.join(' ')}\n\n` +
                                 'Continue?';

            if (confirm(confirmMessage)) {
                await this.printManager.printAllCertificates(this.generatedCertificates);
            }
        } catch (error) {
            console.error('Error printing certificates:', error);
            alert(`Error printing certificates: ${error.message}`);
        }
    }

    /**
     * Show progress section
     */
    showProgress() {
        const progressSection = document.getElementById('progressSection');
        const formContainer = document.querySelector('.form-container');
        
        progressSection.classList.remove('hidden');
        formContainer.style.display = 'none';
    }

    /**
     * Hide progress section
     */
    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        progressSection.classList.add('hidden');
    }

    /**
     * Update progress display
     */
    updateProgress(progress) {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const progressDetails = document.getElementById('progressDetails');

        progressText.textContent = `Generating certificate ${progress.current} of ${progress.total}`;
        progressFill.style.width = `${progress.percentage}%`;
        progressDetails.textContent = `Currently processing: ${progress.student}`;
    }

    /**
     * Show results section
     */
    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContent = document.getElementById('resultsContent');

        const successful = this.generatedCertificates.filter(cert => cert.success);
        const failed = this.generatedCertificates.filter(cert => !cert.success);

        resultsContent.innerHTML = `
            <div class="results-summary">
                <div class="summary-item success">
                    <h4><i class="fas fa-check-circle"></i> Successfully Generated</h4>
                    <p class="summary-number">${successful.length}</p>
                </div>
                ${failed.length > 0 ? `
                <div class="summary-item error">
                    <h4><i class="fas fa-exclamation-circle"></i> Failed</h4>
                    <p class="summary-number">${failed.length}</p>
                </div>
                ` : ''}
            </div>
            
            ${failed.length > 0 ? `
            <div class="failed-list">
                <h4>Failed Certificates:</h4>
                <ul>
                    ${failed.map(cert => `<li>${cert.studentName}: ${cert.error}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;

        resultsSection.classList.remove('hidden');

        // Add individual certificate download buttons
        this.addIndividualDownloadButtons(successful);
    }

    /**
     * Add individual download buttons for certificates
     */
    addIndividualDownloadButtons(certificates) {
        if (certificates.length === 0) return;

        const resultsContent = document.getElementById('resultsContent');
        
        const downloadSection = document.createElement('div');
        downloadSection.className = 'individual-downloads';
        downloadSection.innerHTML = `
            <h4>Individual Downloads:</h4>
            <div class="download-grid">
                ${certificates.map(cert => `
                    <button class="btn btn-secondary download-individual" data-student="${cert.studentName}">
                        <i class="fas fa-download"></i> ${cert.studentName}
                    </button>
                `).join('')}
            </div>
        `;

        resultsContent.appendChild(downloadSection);

        // Add event listeners for individual downloads
        downloadSection.querySelectorAll('.download-individual').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentName = e.currentTarget.dataset.student;
                const certificate = certificates.find(cert => cert.studentName === studentName);
                if (certificate) {
                    this.certificateGenerator.downloadCertificate(certificate);
                }
            });
        });
    }

    /**
     * Download all certificates as ZIP
     */
    async downloadAllCertificates() {
        try {
            this.showLoading('Preparing download...');
            
            const zipBlob = await this.certificateGenerator.createZipFile(this.generatedCertificates);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `ja-certificates-${timestamp}.zip`;
            
            this.certificateGenerator.downloadZip(zipBlob, filename);
            this.hideLoading();

        } catch (error) {
            console.error('Error creating ZIP file:', error);
            alert(`Error creating download: ${error.message}`);
            this.hideLoading();
        }
    }

    /**
     * Reset application to initial state
     */
    resetApplication() {
        // Reset data
        this.studentNames = [];
        this.generatedCertificates = [];

        // Reset form
        const form = document.getElementById('certificateForm');
        form.reset();
        this.setupDateDefault();

        // Hide sections
        document.getElementById('fileName').classList.add('hidden');
        document.getElementById('studentPreview').classList.add('hidden');
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('printerSection').classList.add('hidden');

        // Show form
        document.querySelector('.form-container').style.display = 'block';

        // Disable buttons
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('previewBtn').disabled = true;
    }

    /**
     * Show loading indicator
     */
    showLoading(message = 'Loading...') {
        // Could implement a loading overlay here
        console.log(message);
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        // Hide loading overlay
        console.log('Loading complete');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CertificateApp();
});

// Add styles for results
const style = document.createElement('style');
style.textContent = `
.results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.summary-item {
    text-align: center;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.summary-item.success {
    background-color: #d4edda;
    border-color: #c3e6cb;
    color: #155724;
}

.summary-item.error {
    background-color: #f8d7da;
    border-color: #f5c6cb;
    color: #721c24;
}

.summary-number {
    font-size: 2rem;
    font-weight: bold;
    margin: 10px 0;
}

.failed-list {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
}

.failed-list ul {
    margin: 10px 0;
    padding-left: 20px;
}

.individual-downloads {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #dee2e6;
}

.download-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 10px;
    margin-top: 15px;
}

.download-individual {
    padding: 8px 12px;
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .download-grid {
        grid-template-columns: 1fr;
    }
}
`;
document.head.appendChild(style);