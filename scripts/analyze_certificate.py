#!/usr/bin/env python3
"""
Script to analyze the certificate PDF and find exact positioning for text fields.
"""

from PyPDF2 import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red, blue, green
import io

def create_positioning_guide(page_width, page_height):
    """Create a PDF overlay with positioning guides to help identify correct coordinates."""
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Draw grid lines for reference
    can.setStrokeColor(red)
    can.setLineWidth(0.5)
    
    # Vertical lines every 50 points
    for x in range(0, int(page_width), 50):
        can.line(x, 0, x, page_height)
        can.drawString(x, 10, str(x))
    
    # Horizontal lines every 50 points
    for y in range(0, int(page_height), 50):
        can.line(0, y, page_width, y)
        can.drawString(10, y, str(y))
    
    # Mark common certificate positions based on standard JA layouts
    can.setFillColor(blue)
    can.setFont("Helvetica-Bold", 12)
    
    # Typical student name position (usually around 60-65% from bottom)
    student_y = page_height * 0.62
    can.drawString(50, student_y, f"Student Name Line (~{student_y:.0f})")
    can.setStrokeColor(blue)
    can.line(0, student_y, page_width, student_y)
    
    # Typical school name position (usually around 40-45% from bottom)  
    school_y = page_height * 0.43
    can.drawString(50, school_y, f"School Name Line (~{school_y:.0f})")
    can.line(0, school_y, page_width, school_y)
    
    # Typical date position (usually around 25-30% from bottom)
    date_y = page_height * 0.28
    can.drawString(50, date_y, f"Date Line (~{date_y:.0f})")
    can.line(0, date_y, page_width, date_y)
    
    can.save()
    packet.seek(0)
    return packet

def analyze_certificate():
    """Analyze the certificate template and create a positioning guide."""
    template_path = "E004 Certificate of Achievement.pdf"
    
    try:
        reader = PdfReader(template_path)
        template_page = reader.pages[0]
        page_width = float(template_page.mediabox.width)
        page_height = float(template_page.mediabox.height)
        
        print(f"Certificate dimensions: {page_width} x {page_height}")
        print(f"Aspect ratio: {page_width/page_height:.2f}")
        
        # Extract text to find field labels
        text = template_page.extract_text()
        print("\nExtracted text from certificate:")
        print(text)
        
        # Create positioning guide
        guide_packet = create_positioning_guide(page_width, page_height)
        guide_reader = PdfReader(guide_packet)
        guide_page = guide_reader.pages[0]
        
        # Merge with template
        template_page.merge_page(guide_page)
        
        # Save analysis file
        from PyPDF2 import PdfWriter
        writer = PdfWriter()
        writer.add_page(template_page)
        
        with open("certificate_analysis.pdf", 'wb') as output_file:
            writer.write(output_file)
            
        print("\nAnalysis complete! Check 'certificate_analysis.pdf' for positioning guide.")
        
    except Exception as e:
        print(f"Error analyzing certificate: {str(e)}")

if __name__ == "__main__":
    analyze_certificate()