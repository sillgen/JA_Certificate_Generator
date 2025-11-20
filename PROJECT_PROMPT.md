# JA Certificate Generator - Project Prompt & Documentation

## Project Overview

This is a comprehensive Junior Achievement (JA) certificate generation system that creates personalized certificates for students. The system supports multiple input formats, precise text positioning, optional signature fields, printing capabilities, and can be compiled into a standalone executable.

## Current Architecture

### Core Components

1. **Main Entry Point** (`main.py`)
   - Command-line interface with argparse
   - File path handling for both development and executable modes
   - Integration with all system components

2. **Certificate Generator** (`certificate_generator/certificate_generator.py`)
   - PDF generation using ReportLab and PyPDF2
   - Precise text positioning system with calibrated coordinates
   - Template overlay functionality
   - Bulk certificate generation

3. **File Reader** (`certificate_generator/file_reader.py`)
   - Multi-format student name extraction
   - Supports: .txt, .csv, .xlsx, .docx, .pdf, image files
   - OCR capability for image files using pytesseract
   - Smart name detection and cleaning

4. **Printer Module** (`certificate_generator/printer.py`)
   - CUPS integration for Linux/Mac printing
   - System command fallbacks
   - Printer selection and management
   - Print job handling

5. **CLI Module** (`certificate_generator/cli.py`)
   - Interactive command-line interface
   - Printer selection prompts
   - Error handling and user guidance

## Key Features Implemented

### Text Positioning System
- **Student Name**: X=500, Y=480, Helvetica-Bold, 18pt, center-aligned
- **School Name**: X=500, Y=253, Helvetica, 14pt, center-aligned
- **Date**: X=500, Y=109, Helvetica, 12pt, center-aligned
- **JA Volunteer**: X=380, Y=182, Times-Italic, 14pt, center-aligned
- **Teacher**: X=645, Y=182, Times-Italic, 14pt, center-aligned

### File Format Support
- **Text Files**: One name per line, UTF-8 encoding
- **CSV Files**: First column contains names, headers optional
- **Excel Files**: First column of first sheet, supports .xlsx and .xls
- **Word Documents**: Paragraph text extraction, name pattern recognition
- **PDF Files**: Text extraction using pdfplumber
- **Images**: OCR text extraction using pytesseract

### Template System
- Uses `E004 Certificate of Achievement.pdf` as base template
- Resource path handling for both development and executable modes
- Automatic template discovery in bundled data

### Print System
- CUPS integration with python-pycups
- Fallback to system commands (lpr, lp)
- Printer discovery and selection
- Print job status monitoring

## Command Line Interface

```bash
ja-cert-gen [input_file] [options]

Options:
--school SCHOOL         School name (default: Andrew Jackson Elementary School)
--date DATE            Certificate date (default: 19 November 2025)
--ja-volunteer NAME    JA Volunteer signature name (optional)
--teacher NAME         Teacher signature name (optional)
--output-dir DIR       Output directory (default: certificates)
--print               Print certificates after generation
--printer PRINTER     Specific printer name
--list-printers       List available printers
--help               Show help message
```

## Dependencies

### Core Dependencies
```
PyPDF2>=3.0.0          # PDF manipulation
reportlab>=4.0.0        # PDF generation and text overlay
python-docx>=1.1.0      # Word document reading
openpyxl>=3.1.0         # Excel file reading
pandas>=2.1.0           # Data manipulation and CSV handling
pdfplumber>=0.9.0       # PDF text extraction
Pillow>=10.0.0          # Image processing
pytesseract>=0.3.10     # OCR for image files
```

### Optional Dependencies
```
pycups>=2.0.1           # CUPS printing support (Linux/Mac)
```

### Build Dependencies
```
PyInstaller>=6.0.0      # Executable compilation
setuptools>=68.0.0      # Package building
```

## File Structure

```
JA-Certificate-Generator/
├── main.py                          # Main entry point
├── setup.py                         # Package configuration
├── requirements.txt                 # Dependencies
├── ja-cert-gen.spec                # PyInstaller configuration
├── build_executable.sh             # Build automation script
├── PROJECT_PROMPT.md               # This documentation file
├── certificate_generator/          # Main package
│   ├── __init__.py
│   ├── certificate_generator.py    # Core PDF generation
│   ├── file_reader.py              # Multi-format file reading
│   ├── printer.py                  # Printing functionality
│   └── cli.py                      # Interactive CLI
├── data/                           # Templates and sample files
│   ├── E004 Certificate of Achievement.pdf
│   ├── sample_students.txt
│   ├── sample_students.csv
│   └── IMG_20251119_113455541.jpg
├── output/                         # Generated certificates
├── tests/                          # Test files
├── scripts/                        # Utility scripts
└── dist/                          # Executable distribution
    ├── ja-cert-gen                # Standalone executable
    ├── data/                      # Bundled data files
    ├── certificates/              # Default output location
    └── README.md                  # User documentation
```

## Technical Implementation Details

### PDF Generation Process
1. Load certificate template using PyPDF2
2. Create text overlay using ReportLab Canvas
3. Position text elements with precise coordinates
4. Merge overlay with template
5. Save final certificate as PDF

### Name Extraction Algorithm
1. Detect file format by extension and MIME type
2. Use appropriate parser (docx, pandas, pdfplumber, PIL+tesseract)
3. Extract text content
4. Apply regex patterns to identify names
5. Clean and validate extracted names
6. Remove duplicates and empty entries

### Executable Packaging
- PyInstaller for cross-platform compilation
- Data files bundled with `--add-data` flag
- Resource path resolution for bundled vs development modes
- UPX compression for smaller file size

## Current Status & Testing

### ✅ Completed Features
- Multi-format file reading and name extraction
- Precise certificate text positioning (verified with overlay system)
- Optional signature field support
- Comprehensive error handling
- Print functionality with CUPS and fallback support
- Professional package structure
- Standalone executable compilation
- Complete CLI with all options
- User documentation and README

### 🧪 Tested Scenarios
- 20-student class list processing
- All supported file formats (.txt, .csv, .xlsx, .docx, .pdf, images)
- Custom school names, dates, and signatures
- Print functionality to Canon printer
- Executable distribution and standalone operation
- Output directory customization
- Error handling for missing files and invalid formats

## Future Enhancement Opportunities

### 1. Web Interface Development
```python
# Potential web framework integration
# Flask/FastAPI for REST API
# React/Vue.js for frontend
# File upload and preview functionality
# Real-time certificate generation
```

### 2. Certificate Template Management
```python
# Multiple template support
# Template editor interface
# Custom positioning configuration
# Font and styling options
```

### 3. Batch Processing Enhancements
```python
# Progress tracking for large files
# Resume interrupted jobs
# Email distribution functionality
# Cloud storage integration
```

### 4. Advanced Print Features
```python
# Print preview functionality
# Duplex printing support
# Print queue management
# Network printer discovery
```

### 5. Data Integration
```python
# Google Sheets API integration
# Database connectivity (MySQL, PostgreSQL)
# CSV export of generation logs
# Student information management
```

## Modification Guidelines

### Adding New File Formats
1. Add format detection to `file_reader.py`
2. Implement parser in `_read_[format]` method
3. Add to `supported_formats` dictionary
4. Update documentation and help text

### Customizing Text Positioning
1. Modify `positions` dictionary in `certificate_generator.py`
2. Use coordinate mapping overlay for precise positioning
3. Test with sample certificates before deployment
4. Update documentation with new coordinates

### Adding Print Features
1. Extend `PrinterManager` class in `printer.py`
2. Add new methods for enhanced functionality
3. Update CLI arguments in `main.py`
4. Test with various printer types

### Building Executables
1. Update `ja-cert-gen.spec` for new dependencies
2. Modify `build_executable.sh` for additional steps
3. Test executable on target platforms
4. Update distribution README

## Error Handling Patterns

### File Operations
```python
try:
    # File operation
    pass
except FileNotFoundError:
    print(f"Error: File '{filename}' not found!")
    sys.exit(1)
except PermissionError:
    print(f"Error: Permission denied accessing '{filename}'")
    sys.exit(1)
```

### Optional Dependencies
```python
try:
    import optional_module
    FEATURE_AVAILABLE = True
except ImportError:
    FEATURE_AVAILABLE = False
    optional_module = None
```

### PDF Generation
```python
try:
    # PDF operations
    pass
except Exception as e:
    print(f"Error generating certificate for {student_name}: {e}")
    return False
```

## Configuration Management

### Default Settings
```python
DEFAULT_SCHOOL = "Andrew Jackson Elementary School"
DEFAULT_DATE = "19 November 2025"
DEFAULT_OUTPUT_DIR = "certificates"
DEFAULT_TEMPLATE = "data/E004 Certificate of Achievement.pdf"
```

### File Paths
```python
def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and PyInstaller"""
    try:
        base_path = sys._MEIPASS  # PyInstaller temp folder
    except Exception:
        base_path = os.path.abspath(".")  # Development
    return os.path.join(base_path, relative_path)
```

## Version History & Changelog

### v1.0.0 (November 2025)
- Initial implementation
- Multi-format file reading support
- PDF certificate generation with precise positioning
- Print functionality with CUPS integration
- Standalone executable compilation
- Complete CLI interface
- Professional package structure

### Development Notes
- Project started with basic PDF merging concept
- Evolved to comprehensive certificate management system
- Focused on precise text positioning and professional output
- Emphasized cross-platform compatibility and ease of distribution

## Contact & Maintenance

This project was developed to automate JA certificate generation with professional quality output. The system is designed to be maintainable, extensible, and user-friendly for both technical and non-technical users.

For modifications or enhancements, refer to this prompt file and follow the established patterns for consistency and reliability.