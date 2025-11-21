# JA Certificate Generator - Web Interface

A web-based certificate generator for Junior Achievement programs that runs entirely in the browser.

## 🌐 Live Demo

Visit the web interface at: [https://sillgen.github.io/JA-Certificate-Generator](https://sillgen.github.io/JA-Certificate-Generator)

## ✨ Features

- **File Upload Support**: Upload student lists in TXT, CSV formats
- **Automatic Name Extraction**: Intelligent parsing of student names from various file formats
- **Customizable Information**: Enter school name, teacher, JA volunteer, and date
- **Live Preview**: Preview certificates before generation
- **Batch Generation**: Generate certificates for all students at once
- **Individual Downloads**: Download certificates one by one or all as a ZIP file
- **Print Integration**: Print certificates directly from the browser
- **Responsive Design**: Works on desktop and mobile devices
- **No Server Required**: Runs entirely in the browser for privacy and security

## 🚀 Quick Start

1. Visit the [web interface](https://sillgen.github.io/JA-Certificate-Generator)
2. Upload your student list file (TXT or CSV format)
3. Fill in the certificate information (school, teacher, etc.)
4. Click "Generate Certificates"
5. Download individual certificates or all as a ZIP file

## 📁 Supported File Formats

### Text Files (.txt)
```
John Smith
Jane Doe
Michael Johnson
```

### CSV Files (.csv)
```
Student Name
John Smith
Jane Doe
Michael Johnson
```

Or with multiple columns:
```
First Name,Last Name,Grade
John,Smith,5
Jane,Doe,5
Michael,Johnson,5
```

### Microsoft Word (.docx)
Word documents containing student names in paragraphs or lists. The web interface will extract all text and parse student names automatically.

### Microsoft Excel (.xlsx)
Excel spreadsheets with student names in any column. The system will scan all cells and extract valid student names.

**Note**: PDF files are not supported in the web version. Please convert PDF content to one of the supported formats above.

## 🎨 Certificate Customization

The web interface allows you to customize:
- **School Name**: Default is "Andrew Jackson Elementary School"
- **Teacher Name**: Optional field for the teacher's name
- **JA Volunteer**: Optional field for the JA volunteer's name
- **Date**: Defaults to today's date

## 🖨️ Printing Features

- **Browser Printing**: Print certificates using your browser's print dialog
- **Printer Selection**: Choose from available printers (simulated list)
- **Batch Printing**: Print all certificates at once
- **Print Summary**: Generate a summary report of printed certificates

## 🔧 Technical Details

### Built With
- **HTML5**: Modern semantic markup
- **CSS3**: Responsive design with gradients and animations
- **JavaScript (ES6+)**: Modular architecture with classes
- **PDF-lib**: Client-side PDF generation and manipulation
- **JSZip**: ZIP file creation for batch downloads
- **Font Awesome**: Professional icons

### Browser Requirements
- Modern browser with JavaScript enabled
- Support for PDF-lib (Chrome 63+, Firefox 57+, Safari 11+, Edge 79+)
- Pop-up blocker should be disabled for printing features

### Privacy & Security
- **No Data Upload**: All processing happens in your browser
- **No Server Storage**: Files are processed locally and not stored anywhere
- **Offline Capable**: Once loaded, works without internet connection

## 📱 Mobile Support

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔗 Integration with CLI Tool

This web interface complements the existing CLI tool. You can:
- Use the web interface for quick, one-off certificate generation
- Use the CLI tool for automated or scripted certificate generation
- Both tools generate identical certificate layouts

## 🆘 Troubleshooting

### File Upload Issues
- Ensure file is in TXT or CSV format
- Check that file contains actual student names
- File size should be reasonable (< 10MB)

### Printing Issues
- Allow pop-ups for this website
- Ensure your default printer is set up
- Try downloading certificates and printing from a PDF viewer

### Browser Compatibility
- Use a modern browser (updated within the last 2 years)
- Enable JavaScript
- Clear browser cache if experiencing issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](../LICENSE.md) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the CLI tool documentation for additional context

---

**Note**: This web interface provides the same certificate generation capabilities as the CLI tool but runs entirely in your browser for ease of use and privacy.