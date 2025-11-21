# JA Certificate Generator - Multi-Format File Reader

## Overview
This enhanced certificate generator can automatically read student names from various file formats and generate personalized certificates. The project provides both a **command-line interface (CLI)** and a **web-based interface** for maximum flexibility and ease of use.

## 🌐 Web Interface
**NEW!** Access the certificate generator through your web browser:
**[https://sillgen.github.io/JA-Certificate-Generator](https://sillgen.github.io/JA-Certificate-Generator)**

### Web Interface Features:
- 📁 **Drag & Drop File Upload** - Support for TXT and CSV files
- 🎨 **Live Preview** - See certificate details before generation
- 📱 **Mobile Friendly** - Works on phones, tablets, and computers
- 🔒 **Privacy First** - All processing happens in your browser
- 📦 **Batch Download** - Download all certificates as a ZIP file
- 🖨️ **Print Integration** - Print certificates directly from browser
- ⚡ **No Installation** - Just open in your browser and use

## 💻 Command Line Interface
For developers and advanced users, the CLI tool provides full automation capabilities with support for multiple file formats and advanced features.

## Project Structure
```
JA-Certificate-Completion/
├── certificate_generator/     # Main package
│   ├── __init__.py            # Package initialization
│   ├── certificate_generator.py  # Core certificate generation
│   └── file_reader.py         # Multi-format file reading
├── data/                      # Input files and templates
│   ├── 25-26 Class list.docx  # Class roster
│   ├── E004 Certificate of Achievement.pdf  # Certificate template
│   └── sample_students.txt    # Sample student list
├── output/                    # Generated certificates
│   └── certificates/          # Individual certificate PDFs
├── scripts/                   # Utility scripts
│   ├── analyze_certificate.py # Certificate analysis tools
│   └── create_coordinate_map.py  # Position calibration
├── tests/                     # Test files
│   ├── test_positioning.py    # Position testing
│   └── verify_certificates.py # Output verification
├── main.py                    # Main entry point
├── setup.py                   # Package configuration
├── requirements.txt           # Dependencies
└── README.md                  # This file
```

## Supported File Formats

### Text Files
- **`.txt`** - Plain text files with names on separate lines
- **`.csv`** - Comma-separated values with automatic column detection

### Office Documents  
- **`.docx/.doc`** - Microsoft Word documents
- **`.xlsx/.xls`** - Microsoft Excel spreadsheets

### PDF Documents
- **`.pdf`** - PDF files with extractable text

### Images (requires OCR)
- **`.png`** - Portable Network Graphics
- **`.jpg/.jpeg`** - JPEG images
- **`.tiff`** - TIFF images
- **`.bmp`** - Bitmap images
- **`.gif`** - GIF images

## Quick Start

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd JA-Certificate-Completion

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage
```bash
# Generate certificates using default class list
python main.py

# Generate certificates from a specific file
python main.py data/my_students.xlsx

# Generate certificates from any supported format
python main.py path/to/student_list.csv
```

### File Format Examples

#### Text File Format (`.txt`)
```
John Smith
Maria Garcia  
David Johnson
Lisa Chen
```

#### CSV File Format (`.csv`)
```csv
Student Name,Grade,Teacher
John Smith,K,Mrs. Johnson
Maria Garcia,K,Mrs. Johnson
David Johnson,K,Mrs. Johnson
```

#### Excel File Format (`.xlsx`)
- Supports multiple sheets
- Automatically detects name columns
- Looks for columns with "name", "student", "first", "last" in headers

## Name Recognition Features

### Automatic Pattern Recognition
- **Standard names**: John Smith, Mary Johnson
- **Hyphenated names**: Mary-Jane Smith, Jean-Claude Van Damme  
- **Names with apostrophes**: O'Connor, D'Angelo
- **Mixed case names**: SaMiyah, LaToya
- **Accented characters**: José, François, María
- **Multiple middle names**: John Michael Smith Jr.

### Smart Filtering
- Ignores headers and labels
- Skips lines with dates or numbers
- Removes duplicates
- Validates name structure (minimum 2 parts)

## OCR Support (Images)

### Requirements
Install Tesseract OCR:
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS  
brew install tesseract

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

### Supported Image Types
- Scanned class lists
- Photos of handwritten lists
- Screenshots of digital documents

## Error Handling
- **File not found**: Falls back to default student list
- **Unsupported format**: Shows error message with supported formats
- **No names found**: Uses default list with warning
- **OCR not available**: Shows installation instructions

## Output
- Creates individual PDF certificates in `certificates/` directory
- Filenames: `[Student_Name]_Certificate.pdf`
- Each certificate includes:
  - Student name (perfectly positioned)
  - School name: "Andrew Jackson Elementary School"
  - Date: "19 November 2025"

## Examples

### Using the default class list:
```bash
python main.py
# Uses: data/25-26 Class list.docx (if found)
```

### Using a custom Excel file:
```bash
python main.py "data/my_class_roster.xlsx"
```

### Using a scanned image:
```bash
python main.py "data/handwritten_list.jpg"
# Requires Tesseract OCR
```

## Development

### Running Tests
```bash
python tests/verify_certificates.py
```

### Analyzing Certificate Layout
```bash
python scripts/create_coordinate_map.py
```

### Package Development
```bash
# Install in development mode
pip install -e .

# Install with development dependencies
pip install -e .[dev]
```

## Troubleshooting

### Common Issues
1. **"No names found"** - Check file format and content
2. **"Tesseract not found"** - Install OCR software for images
3. **"File not found"** - Verify file path and name
4. **Wrong positioning** - Text coordinates are pre-calibrated for JA certificates

### Getting Help
Run the file reader independently to test name extraction:
```bash
python -c "from certificate_generator import StudentNameExtractor; extractor = StudentNameExtractor(); print(extractor.extract_names('data/your_file.docx'))"
```

This will show detected names and help troubleshoot format issues.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.