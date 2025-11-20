#!/usr/bin/env python3
"""
Core certificate generation module.
Handles PDF creation and text overlay for personalized certificates.
"""

from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black
import io
import os
import sys
from pathlib import Path
from typing import List, Optional, Dict

try:
    from .printer import PrinterManager
except ImportError:
    PrinterManager = None


def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, relative_path)


class CertificateGenerator:
    """Generate personalized certificates from templates."""
    
    def __init__(self, template_path=None, school_name="Andrew Jackson Elementary School", 
                 date="19 November 2025", ja_volunteer=None, teacher=None):
        """
        Initialize certificate generator.
        
        Args:
            template_path: Path to the PDF template
            school_name: Name of the school
            date: Date for the certificate
            ja_volunteer: Optional JA Volunteer name
            teacher: Optional Teacher name
        """
        self.template_path = template_path
        self.school_name = school_name
        self.date = date
        self.ja_volunteer = ja_volunteer
        self.teacher = teacher
        
        # JA Certificate E004 specific positioning (calibrated coordinates)
        self.positions = {
            'student_name': {'x': 500, 'y': 480, 'font': 'Helvetica-Bold', 'size': 18},
            'school_name': {'x': 500, 'y': 253, 'font': 'Helvetica', 'size': 14},
            'date': {'x': 500, 'y': 109, 'font': 'Helvetica', 'size': 12},
            'ja_volunteer': {'x': 380, 'y': 182, 'font': 'Times-Italic', 'size': 14},
            'teacher': {'x': 645, 'y': 182, 'font': 'Times-Italic', 'size': 14}
        }
    
    def _get_template_path(self):
        """Get the correct template path for both development and executable."""
        if self.template_path:
            # If an explicit template path was provided, use it
            return self.template_path
        
        # Use default template from bundled data
        default_template = get_resource_path(os.path.join("data", "E004 Certificate of Achievement.pdf"))
        
        if os.path.exists(default_template):
            return default_template
        
        # Fallback to current directory structure
        fallback_template = os.path.join("data", "E004 Certificate of Achievement.pdf")
        if os.path.exists(fallback_template):
            return fallback_template
        
        raise FileNotFoundError(f"Certificate template not found at {default_template} or {fallback_template}")
    
    def create_text_overlay(self, student_name, page_width, page_height):
        """Create a PDF overlay with the student information."""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=(page_width, page_height))
        
        # Student name
        pos = self.positions['student_name']
        can.setFont(pos['font'], pos['size'])
        can.setFillColor(black)
        text_width = can.stringWidth(student_name, pos['font'], pos['size'])
        can.drawString(pos['x'] - text_width/2, pos['y'], student_name)
        
        # School name
        pos = self.positions['school_name']
        can.setFont(pos['font'], pos['size'])
        text_width = can.stringWidth(self.school_name, pos['font'], pos['size'])
        can.drawString(pos['x'] - text_width/2, pos['y'], self.school_name)
        
        # Date
        pos = self.positions['date']
        can.setFont(pos['font'], pos['size'])
        text_width = can.stringWidth(self.date, pos['font'], pos['size'])
        can.drawString(pos['x'] - text_width/2, pos['y'], self.date)
        
        # JA Volunteer (optional)
        if self.ja_volunteer:
            pos = self.positions['ja_volunteer']
            can.setFont(pos['font'], pos['size'])
            text_width = can.stringWidth(self.ja_volunteer, pos['font'], pos['size'])
            can.drawString(pos['x'] - text_width/2, pos['y'], self.ja_volunteer)
        
        # Teacher (optional)
        if self.teacher:
            pos = self.positions['teacher']
            can.setFont(pos['font'], pos['size'])
            text_width = can.stringWidth(self.teacher, pos['font'], pos['size'])
            can.drawString(pos['x'] - text_width/2, pos['y'], self.teacher)
        
        can.save()
        packet.seek(0)
        return packet
    
    def generate_single_certificate(self, student_name, output_path):
        """Generate a personalized certificate for a single student."""
        try:
            # Get template path (handles both bundled executable and development)
            template_path = self._get_template_path()
            if not os.path.exists(template_path):
                raise FileNotFoundError(f"Template file not found: {template_path}")
            
            # Read the template PDF
            reader = PdfReader(template_path)
            writer = PdfWriter()
            
            # Get the first page (assuming single page certificate)
            template_page = reader.pages[0]
            page_width = float(template_page.mediabox.width)
            page_height = float(template_page.mediabox.height)
            
            # Create text overlay
            overlay_packet = self.create_text_overlay(student_name, page_width, page_height)
            overlay_reader = PdfReader(overlay_packet)
            overlay_page = overlay_reader.pages[0]
            
            # Merge the overlay with the template
            template_page.merge_page(overlay_page)
            writer.add_page(template_page)
            
            # Ensure output directory exists
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            # Write the output PDF
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
                
            return True
            
        except Exception as e:
            print(f"Error generating certificate for {student_name}: {str(e)}")
            return False
    
    def generate_bulk_certificates(self, student_names, output_dir=None, print_certificates=False, printer_name=None):
        """Generate certificates for multiple students."""
        if not student_names:
            raise ValueError("No student names provided")
        
        # Use default output directory if none provided
        if output_dir is None:
            output_dir = "certificates"
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        successful = 0
        failed = 0
        generated_files = []
        
        for student_name in student_names:
            # Create safe filename from student name
            safe_filename = self._create_safe_filename(student_name)
            output_path = os.path.join(output_dir, f"{safe_filename}_Certificate.pdf")
            
            if self.generate_single_certificate(student_name, output_path):
                print(f"Generated certificate for: {student_name}")
                successful += 1
                generated_files.append(output_path)
            else:
                failed += 1
        
        print(f"\nCompleted! Generated {successful} certificates in '{output_dir}'")
        if failed > 0:
            print(f"Failed to generate {failed} certificates")
        
        # Handle printing if requested
        if print_certificates and generated_files:
            self._handle_printing(generated_files, printer_name)
        
        return successful, failed
    
    def _handle_printing(self, pdf_files: List[str], printer_name: Optional[str] = None):
        """Handle printing of generated certificates."""
        if PrinterManager is None:
            print("Warning: Printing functionality not available (pycups not installed)")
            return
        
        printer_manager = PrinterManager()
        
        # Select printer if not specified
        if not printer_name:
            print("\nPrint Options:")
            printer_name = printer_manager.select_printer()
            
            if not printer_name:
                print("Printing cancelled")
                return
        
        # Verify printer exists
        available_printers = printer_manager.get_available_printers()
        if printer_name not in available_printers:
            print(f"Error: Printer '{printer_name}' not found!")
            print("Available printers:")
            printer_manager.list_printers()
            return
        
        # Print certificates
        print(f"\nPrinting {len(pdf_files)} certificates...")
        results = printer_manager.print_multiple_pdfs(pdf_files, printer_name)
        
        return results
    
    def _create_safe_filename(self, student_name):
        """Create a safe filename from student name."""
        safe_filename = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in student_name)
        return safe_filename.replace(' ', '_')
    
    def update_positioning(self, field, x=None, y=None, font=None, size=None):
        """Update positioning for a specific field."""
        if field in self.positions:
            if x is not None:
                self.positions[field]['x'] = x
            if y is not None:
                self.positions[field]['y'] = y
            if font is not None:
                self.positions[field]['font'] = font
            if size is not None:
                self.positions[field]['size'] = size
        else:
            raise ValueError(f"Unknown field: {field}")
    
    def get_positioning(self):
        """Get current positioning configuration."""
        return self.positions.copy()