#!/usr/bin/env python3
"""
Test script to generate a single certificate for positioning verification.
"""

from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black
import io

def create_text_overlay(student_name, school_name, date, page_width, page_height):
    """Create a PDF overlay with the student information."""
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Based on JA Certificate E004 layout analysis:
    # Certificate dimensions: 792 x 612 (11" x 8.5" landscape)
    
    # Student name positioning - centered over "Student Name" line
    # The student name line appears to be around 380 points from bottom
    can.setFont("Helvetica-Bold", 20)
    can.setFillColor(black)
    
    student_name_x = page_width / 2  # Center horizontally
    student_name_y = 380  # Position above the "Student Name" line
    
    # Draw student name centered
    text_width = can.stringWidth(student_name, "Helvetica-Bold", 20)
    can.drawString(student_name_x - text_width/2, student_name_y, student_name)
    
    # School name positioning - centered over "School Name" line
    # The school name line appears to be around 250 points from bottom
    can.setFont("Helvetica", 16)
    school_name_x = page_width / 2  # Center horizontally  
    school_name_y = 250  # Position above the "School Name" line
    
    school_text_width = can.stringWidth(school_name, "Helvetica", 16)
    can.drawString(school_name_x - school_text_width/2, school_name_y, school_name)
    
    # Date positioning - centered over "Date" line
    # The date line appears to be around 120 points from bottom
    can.setFont("Helvetica", 14)
    date_x = page_width / 2  # Center horizontally
    date_y = 120  # Position above the "Date" line
    
    date_text_width = can.stringWidth(date, "Helvetica", 14)
    can.drawString(date_x - date_text_width/2, date_y, date)
    
    can.save()
    packet.seek(0)
    return packet

def test_single_certificate():
    """Generate a test certificate to verify positioning."""
    template_path = "E004 Certificate of Achievement.pdf"
    output_path = "test_certificate.pdf"
    
    student_name = "Test Student Name"
    school_name = "Andrew Jackson Elementary School"
    date = "19 November 2025"
    
    try:
        # Read the template PDF
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Get the first page
        template_page = reader.pages[0]
        page_width = float(template_page.mediabox.width)
        page_height = float(template_page.mediabox.height)
        
        print(f"Page dimensions: {page_width} x {page_height}")
        
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
            
        print(f"Test certificate generated: {output_path}")
        print("Please check the positioning and adjust coordinates if needed.")
        
    except Exception as e:
        print(f"Error generating test certificate: {str(e)}")

if __name__ == "__main__":
    test_single_certificate()