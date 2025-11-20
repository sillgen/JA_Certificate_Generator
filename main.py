#!/usr/bin/env python3
"""
Main entry point for the JA Certificate Generator.
Generates personalized certificates from various input file formats.
"""

import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from certificate_generator import StudentNameExtractor, CertificateGenerator


def main():
    """Main function to generate all certificates."""
    import argparse
    
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='Generate JA certificates from student lists')
    parser.add_argument('input_file', nargs='?', help='Path to student list file')
    parser.add_argument('--ja-volunteer', help='JA Volunteer name (optional)')
    parser.add_argument('--teacher', help='Teacher name (optional)')
    parser.add_argument('--school', default="Andrew Jackson Elementary School", 
                       help='School name (default: Andrew Jackson Elementary School)')
    parser.add_argument('--date', default="19 November 2025", 
                       help='Certificate date (default: 19 November 2025)')
    parser.add_argument('--print', action='store_true', 
                       help='Print certificates after generation')
    parser.add_argument('--printer', help='Specify printer name (if not provided, will prompt for selection)')
    parser.add_argument('--output-dir', default="certificates", 
                       help='Output directory for certificates (default: certificates in current directory)')
    parser.add_argument('--list-printers', action='store_true', 
                       help='List available printers and exit')
    
    args = parser.parse_args()
    
    # Handle list printers option
    if args.list_printers:
        try:
            from certificate_generator.printer import PrinterManager
            printer_manager = PrinterManager()
            printer_manager.list_printers()
        except ImportError:
            print("Printing functionality not available (pycups not installed)")
            print("Install with: pip install pycups")
        return
    
    # Default paths (relative to project root)
    template_path = project_root / "data" / "E004 Certificate of Achievement.pdf"
    
    # Set output directory - handle both absolute and relative paths
    if os.path.isabs(args.output_dir):
        output_dir = Path(args.output_dir)
    else:
        # For relative paths, use current working directory (not project root)
        output_dir = Path.cwd() / args.output_dir
    
    # Handle input file
    input_file = None
    if args.input_file:
        if not os.path.isabs(args.input_file):
            # Make relative paths relative to project root
            input_file = project_root / args.input_file
        else:
            input_file = Path(args.input_file)
            
        if not input_file.exists():
            print(f"Error: File '{input_file}' not found!")
            sys.exit(1)
    else:
        # Look for common class list files in data directory
        data_dir = project_root / "data"
        possible_files = [
            "25-26 Class list.docx",
            "class_list.docx", 
            "student_list.txt",
            "students.csv",
            "class_list.xlsx"
        ]
        
        for file_name in possible_files:
            test_path = data_dir / file_name
            if test_path.exists():
                input_file = test_path
                break
    
    # Get student names
    if input_file and input_file.exists():
        print(f"Reading student names from: {input_file}")
        extractor = StudentNameExtractor()
        student_names = extractor.extract_names(str(input_file))
        
        if not student_names:
            print("Warning: No names found in file, using default list")
            student_names = get_default_names()
    else:
        print("Using default student list")
        student_names = get_default_names()
    
    if not student_names:
        print("Error: No student names found!")
        sys.exit(1)
    
    print(f"Will generate certificates for {len(student_names)} students")
    
    # Initialize certificate generator
    if not template_path.exists():
        print(f"Error: Template file not found: {template_path}")
        sys.exit(1)
    
    generator = CertificateGenerator(
        template_path=str(template_path),
        school_name=args.school,
        date=args.date,
        ja_volunteer=args.ja_volunteer,
        teacher=args.teacher
    )
    
    # Generate certificates
    successful, failed = generator.generate_bulk_certificates(
        student_names, 
        str(output_dir),
        print_certificates=args.print,
        printer_name=args.printer
    )
    
    if failed > 0:
        sys.exit(1)


def get_default_names():
    """Get the default student names list."""
    return [
        "Jazmin Badillo Deras",
        "Maislyn Brinkley", 
        "Nicolas Bustos Henao",
        "Kinzley Calvin",
        "Emma Falasca Gobbo",
        "Tynslee Fishler",
        "Sebastian Garcia",
        "Elisa Hernandez Teletor",
        "Miller Katsetos",
        "Aiden Kennedy",
        "Adan Lopez",
        "Joshua Primero Avila",
        "Milton Rivera",
        "Julian Schultz",
        "Axel Spain",
        "SaMiyah Turner",
        "Shehzeen Usman",
        "Jameson Weeks",
        "Ryder White",
        "Ryiana White"
    ]


if __name__ == "__main__":
    main()