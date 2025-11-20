/**
 * File Parser Module
 * Handles parsing of various file formats to extract student names
 */

class FileParser {
    constructor() {
        this.supportedFormats = {
            'text/plain': this.parseTextFile.bind(this),
            'text/csv': this.parseCsvFile.bind(this),
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.parseDocxFile.bind(this),
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': this.parseXlsxFile.bind(this),
            'application/pdf': this.parsePdfFile.bind(this),
            'application/vnd.ms-excel': this.parseXlsxFile.bind(this),
            'text/comma-separated-values': this.parseCsvFile.bind(this)
        };
    }

    /**
     * Parse a file and extract student names
     * @param {File} file - The file to parse
     * @returns {Promise<string[]>} Array of student names
     */
    async parseFile(file) {
        try {
            const fileType = this.detectFileType(file);
            console.log(`Parsing ${fileType} file: ${file.name}`);
            
            if (!this.supportedFormats[fileType]) {
                // Try to parse as text for unknown types
                return await this.parseTextFile(file);
            }

            return await this.supportedFormats[fileType](file);
        } catch (error) {
            console.error('Error parsing file:', error);
            throw new Error(`Failed to parse file: ${error.message}`);
        }
    }

    /**
     * Detect file type based on MIME type and extension
     * @param {File} file 
     * @returns {string} MIME type or best guess
     */
    detectFileType(file) {
        if (file.type) {
            return file.type;
        }

        // Fallback based on file extension
        const extension = file.name.toLowerCase().split('.').pop();
        const extensionMap = {
            'txt': 'text/plain',
            'csv': 'text/csv',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pdf': 'application/pdf',
            'xls': 'application/vnd.ms-excel'
        };

        return extensionMap[extension] || 'text/plain';
    }

    /**
     * Parse plain text file
     * @param {File} file 
     * @returns {Promise<string[]>}
     */
    async parseTextFile(file) {
        const text = await this.readFileAsText(file);
        return this.extractNamesFromText(text);
    }

    /**
     * Parse CSV file
     * @param {File} file 
     * @returns {Promise<string[]>}
     */
    async parseCsvFile(file) {
        const text = await this.readFileAsText(file);
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        const names = [];
        for (const line of lines) {
            // Split by common CSV delimiters
            const cells = line.split(/[,;\t]/).map(cell => cell.trim().replace(/['"]/g, ''));
            
            // Look for names in each cell
            for (const cell of cells) {
                const cellNames = this.extractNamesFromText(cell);
                names.push(...cellNames);
            }
        }

        // If we didn't find names in cells, try parsing the whole text
        if (names.length === 0) {
            return this.extractNamesFromText(text);
        }

        return [...new Set(names)]; // Remove duplicates
    }

    /**
     * Parse DOCX file using mammoth.js
     * @param {File} file 
     * @returns {Promise<string[]>}
     */
    async parseDocxFile(file) {
        try {
            if (!window.mammoth) {
                throw new Error('DOCX parser not available. Please convert to TXT or CSV format.');
            }

            // Convert file to array buffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // Extract text from DOCX
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            
            if (result.messages && result.messages.length > 0) {
                console.warn('DOCX parsing warnings:', result.messages);
            }
            
            if (!result.value || result.value.trim().length === 0) {
                throw new Error('No text content found in DOCX file');
            }

            return this.extractNamesFromText(result.value);
            
        } catch (error) {
            console.error('Error parsing DOCX file:', error);
            throw new Error(`Failed to parse DOCX file: ${error.message}. Please try converting to TXT or CSV format.`);
        }
    }

    /**
     * Parse XLSX file using SheetJS
     * @param {File} file 
     * @returns {Promise<string[]>}
     */
    async parseXlsxFile(file) {
        try {
            if (!window.XLSX) {
                throw new Error('XLSX parser not available. Please convert to CSV format.');
            }

            // Convert file to array buffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // Parse the workbook
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                throw new Error('No worksheets found in XLSX file');
            }
            
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to CSV format and then extract names
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            
            if (!csv || csv.trim().length === 0) {
                throw new Error('No data found in XLSX worksheet');
            }

            // Use the CSV parser logic to extract names
            const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
            
            const names = [];
            for (const line of lines) {
                // Skip lines that look like headers
                if (this.isHeaderLine(line)) {
                    continue;
                }

                // Split by common CSV delimiters
                const cells = line.split(/[,;\t]/).map(cell => cell.trim().replace(/['"]/g, ''));
                
                // Look for names in each cell
                for (const cell of cells) {
                    const cellNames = this.extractNamesFromText(cell);
                    names.push(...cellNames);
                }
            }

            // If we didn't find names in cells, try parsing the whole text
            if (names.length === 0) {
                return this.extractNamesFromText(csv);
            }

            return [...new Set(names)]; // Remove duplicates
            
        } catch (error) {
            console.error('Error parsing XLSX file:', error);
            throw new Error(`Failed to parse XLSX file: ${error.message}. Please try converting to CSV format.`);
        }
    }

    /**
     * Parse PDF file (not implemented in web version)
     * @param {File} file 
     * @returns {Promise<string[]>}
     */
    async parsePdfFile(file) {
        throw new Error('PDF files are not supported in the web version. Please convert to TXT, CSV, DOCX, or XLSX format. You can copy the text from the PDF and save it as a TXT file.');
    }

    /**
     * Read file content as text
     * @param {File} file 
     * @returns {Promise<string>}
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Read file content as array buffer
     * @param {File} file 
     * @returns {Promise<ArrayBuffer>}
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract names from text using pattern matching
     * @param {string} text 
     * @returns {string[]}
     */
    extractNamesFromText(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const names = [];
        
        // Split text into lines and clean them
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        for (const line of lines) {
            // Skip lines that look like headers or labels
            if (this.isHeaderLine(line)) {
                continue;
            }

            // Extract potential names from the line
            const lineNames = this.extractNamesFromLine(line);
            names.push(...lineNames);
        }

        return this.cleanAndValidateNames(names);
    }

    /**
     * Check if a line is likely a header or label
     * @param {string} line 
     * @returns {boolean}
     */
    isHeaderLine(line) {
        const lowerLine = line.toLowerCase();
        const headerKeywords = [
            'student', 'name', 'class', 'list', 'roster', 'grade',
            'first', 'last', 'full', 'students', 'names'
        ];
        
        return headerKeywords.some(keyword => lowerLine.includes(keyword)) && 
               !this.isValidName(line);
    }

    /**
     * Extract names from a single line
     * @param {string} line 
     * @returns {string[]}
     */
    extractNamesFromLine(line) {
        const names = [];
        
        // Remove common prefixes/numbers
        let cleanLine = line.replace(/^\d+\.?\s*/, '').trim();
        cleanLine = cleanLine.replace(/^[-*•]\s*/, '').trim();
        
        // Check if the whole line is a name
        if (this.isValidName(cleanLine)) {
            names.push(cleanLine);
        } else {
            // Try to split by common separators and check each part
            const parts = cleanLine.split(/[,;|]/).map(part => part.trim());
            for (const part of parts) {
                if (this.isValidName(part)) {
                    names.push(part);
                }
            }
        }

        return names;
    }

    /**
     * Check if a string looks like a valid name
     * @param {string} str 
     * @returns {boolean}
     */
    isValidName(str) {
        if (!str || typeof str !== 'string') {
            return false;
        }

        const cleanStr = str.trim();
        
        // Basic length check
        if (cleanStr.length < 2 || cleanStr.length > 100) {
            return false;
        }

        // Should contain at least one letter
        if (!/[a-zA-Z]/.test(cleanStr)) {
            return false;
        }

        // Should not be mostly numbers
        const letterCount = (cleanStr.match(/[a-zA-Z]/g) || []).length;
        if (letterCount < cleanStr.length * 0.5) {
            return false;
        }

        // Basic name pattern: should have at least first and last name
        const words = cleanStr.split(/\s+/).filter(word => word.length > 0);
        if (words.length < 2) {
            return false;
        }

        // Each word should start with a letter
        if (!words.every(word => /^[a-zA-Z]/.test(word))) {
            return false;
        }

        // Should not contain common non-name patterns
        const invalidPatterns = [
            /^\d+$/, // just numbers
            /@/, // email
            /^https?:\/\//, // URL
            /\.(com|org|net|edu)/, // domain
            /^\w+\.\w+$/ // file extension pattern
        ];

        if (invalidPatterns.some(pattern => pattern.test(cleanStr))) {
            return false;
        }

        return true;
    }

    /**
     * Clean and validate the extracted names
     * @param {string[]} names 
     * @returns {string[]}
     */
    cleanAndValidateNames(names) {
        return names
            .map(name => this.cleanName(name))
            .filter(name => name && this.isValidName(name))
            .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates
    }

    /**
     * Clean individual name
     * @param {string} name 
     * @returns {string}
     */
    cleanName(name) {
        if (!name) return '';
        
        return name
            .trim()
            .replace(/\s+/g, ' ') // normalize whitespace
            .replace(/[^\w\s'-]/g, '') // remove special characters except apostrophes and hyphens
            .trim();
    }
}

// Export for use in other modules
window.FileParser = FileParser;