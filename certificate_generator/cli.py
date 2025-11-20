#!/usr/bin/env python3
"""
Command-line interface for the JA Certificate Generator.
"""

import sys
import os
from pathlib import Path

from .file_reader import StudentNameExtractor
from .certificate_generator import CertificateGenerator


def main():
    """Main CLI function."""
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
    parser.add_argument('--list-printers', action='store_true', 
                       help='List available printers and exit')
    
    args = parser.parse_args()
    
    # Handle list printers option
    if args.list_printers:
        try:
            from .printer import PrinterManager
            printer_manager = PrinterManager()
            printer_manager.list_printers()
        except ImportError:
            print("Printing functionality not available (pycups not installed)")
            print("Install with: pip install pycups")
        return
    
    # Get the project root (parent of the package directory)
    package_dir = Path(__file__).parent
    project_root = package_dir.parent
    
    # Default paths
    template_path = project_root / "data" / "E004 Certificate of Achievement.pdf"
    output_dir = project_root / "output" / "certificates"
    
    # Handle input file
    input_file = None
    if args.input_file:
        if not os.path.isabs(args.input_file):
            # Make relative paths relative to current working directory
            input_file = Path.cwd() / args.input_file
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
        print(f"Make sure the data directory contains the certificate template.")
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