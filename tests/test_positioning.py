#!/usr/bin/env python3
"""
Test script to generate a single certificate with new positioning.
"""

from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black
import io
import os

def create_text_overlay(student_name, school_name, date, page_width, page_height):
    """Create a PDF overlay with the student information."""
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Based on JA Certificate E004 layout analysis
    # Certificate dimensions: 792 x 612 points (11" x 8.5")
    
    # Student name positioning - appears on the main line in the certificate
    # Position based on the actual blank line location in the certificate
    can.setFont("Helvetica-Bold", 20)  # Slightly smaller for better fit
    can.setFillColor(black)
    
    # Student name - positioned to align with the blank line on the certificate
    # From analysis: the student name line is approximately 60% from bottom
    student_name_x = 240  # Left-aligned to match certificate design
    student_name_y = 368  # Adjusted to align with the actual line
    
    can.drawString(student_name_x, student_name_y, student_name)
    
    # School name positioning
    # The school name appears below the main text, usually around 35-40% from bottom
    can.setFont("Helvetica", 14)
    school_name_x = 240  # Left-aligned to match certificate layout
    school_name_y = 225  # Adjusted to align with school name line
    
    can.drawString(school_name_x, school_name_y, school_name)
    
    # Date positioning  
    # Date typically appears in the bottom section, around 20-25% from bottom
    can.setFont("Helvetica", 12)
    date_x = 590  # Positioned towards the right side for date field
    date_y = 135   # Adjusted to align with date line
    
    can.drawString(date_x, date_y, date)
    
    can.save()
    packet.seek(0)
    return packet

def generate_test_certificate():
    """Generate a test certificate with improved positioning."""
    template_path = "E004 Certificate of Achievement.pdf"
    student_name = "Adan Lopez"
    school_name = "Andrew Jackson Elementary School"
    date = "19 November 2025"
    output_path = "test_improved_certificate.pdf"
    
    try:
        # Read the template PDF
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Get the first page
        template_page = reader.pages[0]
        page_width = float(template_page.mediabox.width)
        page_height = float(template_page.mediabox.height)
        
        # Create text overlay
        overlay_packet = create_text_overlay(student_name, school_name, date, page_width, page_height)
        overlay_reader = PdfReader(overlay_packet)
        overlay_page = overlay_reader.pages[0]
        
        # Merge the overlay with the template
        template_page.merge_page(overlay_page)
        writer.add_page(template_page)
        
        # Write the output PDF
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
            
        print(f"Generated test certificate: {output_path}")
        print("Please check the positioning and let me know if further adjustments are needed.")
        
    except Exception as e:
        print(f"Error generating test certificate: {str(e)}")

if __name__ == "__main__":
    generate_test_certificate()