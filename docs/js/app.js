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
        
        // Check library availability and show status
        this.checkLibraryStatus();
    }

    /**
     * Check and display library loading status
     */
    checkLibraryStatus() {
        console.log('Checking library status...');
        console.log('PDF-lib:', !!window.PDFLib);
        console.log('JSZip:', !!window.JSZip);
        console.log('Mammoth:', !!window.mammoth);
        console.log('XLSX:', !!window.XLSX);
        
        // You could add a small status indicator to the UI if needed
        if (!window.mammoth || !window.XLSX) {
            console.warn('Some libraries may not have loaded properly. DOCX/XLSX support may be limited.');
        }
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

        // Add name functionality
        const addNameBtn = document.getElementById('addNameBtn');
        addNameBtn.addEventListener('click', this.addName.bind(this));

        const newNameInput = document.getElementById('newNameInput');
        newNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addName();
            }
        });

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
     * Load available print options
     */
    async loadPrinters() {
        const printerSelect = document.getElementById('printerSelect');
        printerSelect.innerHTML = '<option value="">Loading print options...</option>';

        try {
            const printOptions = await this.printManager.getAvailablePrinters();
            
            printerSelect.innerHTML = '<option value="">Select print method...</option>';
            printOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                printerSelect.appendChild(optionElement);
            });

            // Select the first (recommended) option by default
            if (printOptions.length > 0) {
                printerSelect.value = printOptions[0];
            }

        } catch (error) {
            console.error('Error loading print options:', error);
            printerSelect.innerHTML = '<option value="">Error loading print options</option>';
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
            const foundNames = await this.fileParser.parseFile(file);
            
            if (foundNames.length === 0) {
                // Still show preview even with no names so user can add manually
                this.studentNames = [];
                this.displayStudentPreview([]);
                alert('No student names were automatically detected in the file. You can add names manually using the form below.');
            } else {
                // Show preview with found names
                this.displayStudentPreview(foundNames);
            }
            
            // Always enable the interface for manual editing
            this.updateButtonStates();
            
            this.hideLoading();

        } catch (error) {
            console.error('Error processing file:', error);
            
            // Show a more user-friendly error message
            let errorMessage = error.message;
            
            // Check if it's a library loading issue
            if (errorMessage.includes('not available') || errorMessage.includes('Library not loaded')) {
                errorMessage = `Library Loading Issue: ${errorMessage}\n\nThis might be due to:\n• Slow internet connection\n• Browser blocking external resources\n• Ad blocker interfering\n\nSolutions:\n1. Refresh the page and try again\n2. Disable ad blocker for this site\n3. Convert your file to TXT format as a workaround`;
            }
            
            // For DOCX alternative message, show as a more formatted alert
            if (errorMessage.includes('To proceed:')) {
                this.showDetailedError('DOCX Conversion Needed', errorMessage);
            } else {
                alert(`Error processing file: ${errorMessage}`);
            }
            
            this.hideLoading();
        }
    }

    /**
     * Display preview of found student names with edit capabilities
     */
    displayStudentPreview(names) {
        this.studentNames = [...names]; // Store a copy
        this.renderStudentList();
        
        const preview = document.getElementById('studentPreview');
        preview.classList.remove('hidden');
    }

    /**
     * Render the student list with edit capabilities
     */
    renderStudentList() {
        const studentList = document.getElementById('studentList');
        const nameCount = document.getElementById('nameCount');
        
        studentList.innerHTML = '';
        
        if (this.studentNames.length === 0) {
            studentList.innerHTML = '<div class="no-names-message">No names found. Add names manually below.</div>';
        } else {
            this.studentNames.forEach((name, index) => {
                const nameElement = document.createElement('div');
                nameElement.className = 'student-name';
                nameElement.innerHTML = `
                    <span class="name-text">${name}</span>
                    <button class="remove-name" title="Remove this name" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Add remove event listener
                const removeBtn = nameElement.querySelector('.remove-name');
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removeName(index);
                });
                
                studentList.appendChild(nameElement);
            });
        }
        
        // Update count
        nameCount.textContent = this.studentNames.length;
        
        // Update button states
        this.updateButtonStates();
    }

    /**
     * Remove a name from the list
     */
    removeName(index) {
        if (index >= 0 && index < this.studentNames.length) {
            const removedName = this.studentNames[index];
            this.studentNames.splice(index, 1);
            this.renderStudentList();
            
            console.log(`Removed name: ${removedName}`);
        }
    }

    /**
     * Add a new name manually
     */
    addName() {
        const newNameInput = document.getElementById('newNameInput');
        const newName = newNameInput.value.trim();
        
        if (!newName) {
            alert('Please enter a name to add.');
            return;
        }
        
        // Check for duplicates
        if (this.studentNames.includes(newName)) {
            alert('This name is already in the list.');
            newNameInput.value = '';
            return;
        }
        
        // Validate name format
        if (!this.isValidName(newName)) {
            alert('Please enter a valid name (first and last name with letters only).');
            return;
        }
        
        // Add the name
        this.studentNames.push(newName);
        this.renderStudentList();
        
        // Clear input
        newNameInput.value = '';
        newNameInput.focus();
        
        console.log(`Added name: ${newName}`);
    }

    /**
     * Validate if a name is in the correct format
     */
    isValidName(name) {
        // Basic validation: should have at least 2 words, letters and common characters only
        const namePattern = /^[a-zA-Z\s\-'\.]{2,}$/;
        const words = name.split(/\s+/).filter(word => word.length > 0);
        
        return namePattern.test(name) && words.length >= 2 && name.length <= 100;
    }

    /**
     * Update button states based on current data
     */
    updateButtonStates() {
        const generateBtn = document.getElementById('generateBtn');
        const previewBtn = document.getElementById('previewBtn');
        const hasNames = this.studentNames.length > 0;
        
        generateBtn.disabled = !hasNames;
        previewBtn.disabled = !hasNames;
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
            
            const confirmMessage = `Ready to print ${this.generatedCertificates.filter(c => c.success).length} certificates!\n\n` +
                                 `Using: ${printInfo.method}\n\n` +
                                 `Benefits:\n` +
                                 `• ${printInfo.advantages.join('\n• ')}\n\n` +
                                 'Each certificate will open your browser\'s print dialog where you can select your printer.\n\n' +
                                 'Continue with printing?';

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
        
        // Add print options if printing was enabled
        this.addPrintInterface(successful);
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
     * Add print interface for certificates
     */
    addPrintInterface(certificates) {
        const enablePrinting = document.getElementById('enablePrinting');
        if (!enablePrinting.checked || certificates.length === 0) return;

        const resultsContent = document.getElementById('resultsContent');
        
        const printSection = document.createElement('div');
        printSection.className = 'print-interface';
        printSection.innerHTML = `
            <div class="print-header">
                <h4><i class="fas fa-print"></i> Print Certificates</h4>
                <p>Use your local printer to print the generated certificates</p>
            </div>
            <div class="print-options">
                <button class="btn btn-primary print-all-individual" id="printAllIndividual">
                    <i class="fas fa-print"></i> Print All (Individual Dialogs)
                </button>
                <button class="btn btn-secondary print-all-combined" id="printAllCombined">
                    <i class="fas fa-file-pdf"></i> Print All (Combined PDF)
                </button>
            </div>
            <div class="print-individual-list">
                <h5>Print Individual Certificates:</h5>
                <div class="print-grid">
                    ${certificates.map(cert => `
                        <button class="btn btn-outline print-individual" data-student="${cert.studentName}">
                            <i class="fas fa-print"></i> ${cert.studentName}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        resultsContent.appendChild(printSection);

        // Add event listeners for print buttons
        document.getElementById('printAllIndividual').addEventListener('click', () => {
            this.printManager.printAllCertificates(certificates);
        });

        document.getElementById('printAllCombined').addEventListener('click', () => {
            this.printManager.printAllCombined(certificates);
        });

        printSection.querySelectorAll('.print-individual').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentName = e.currentTarget.dataset.student;
                const certificate = certificates.find(cert => cert.studentName === studentName);
                if (certificate) {
                    this.printManager.printCertificate(certificate);
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

        // Clear add name input
        document.getElementById('newNameInput').value = '';

        // Hide sections
        document.getElementById('fileName').classList.add('hidden');
        document.getElementById('studentPreview').classList.add('hidden');
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('printerSection').classList.add('hidden');

        // Show form
        document.querySelector('.form-container').style.display = 'block';

        // Update button states
        this.updateButtonStates();
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

    /**
     * Show a detailed error message in a better format
     */
    showDetailedError(title, message) {
        // For now, use a formatted alert. In the future, could use a modal
        const formattedMessage = `${title}\n\n${message.replace(/\n/g, '\n')}`;
        alert(formattedMessage);
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