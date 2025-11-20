#!/usr/bin/env python3
"""
Script to analyze the certificate template and help determine proper text positioning.
"""

from PyPDF2 import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import red, blue, green
import io

def analyze_certificate_layout():
    """Analyze the certificate template and create a grid overlay to help with positioning."""
    template_path = "E004 Certificate of Achievement.pdf"
    
    try:
        # Read the template PDF
        reader = PdfReader(template_path)
        template_page = reader.pages[0]
        page_width = float(template_page.mediabox.width)
        page_height = float(template_page.mediabox.height)
        
        print(f"Certificate dimensions: {page_width} x {page_height} points")
        print(f"Certificate dimensions in inches: {page_width/72:.2f} x {page_height/72:.2f}")
        
        # Based on typical JA certificate layouts, let's try more accurate positioning
        # JA certificates typically have:
        # - Student name field around 60-65% from bottom
        # - School name field around 35-40% from bottom  
        # - Date field around 20-25% from bottom
        
        # More precise coordinates based on JA certificate standard layout
        student_name_y = page_height * 0.62  # About 62% from bottom
        school_name_y = page_height * 0.38   # About 38% from bottom
        date_y = page_height * 0.22          # About 22% from bottom
        
        # X coordinates - typically left-aligned to specific positions
        # Student name usually starts around 30% from left
        student_name_x = page_width * 0.30
        # School name and date are usually left-aligned to similar position
        school_name_x = page_width * 0.30
        date_x = page_width * 0.30
        
        print(f"\nSuggested coordinates:")
        print(f"Student Name: ({student_name_x:.1f}, {student_name_y:.1f})")
        print(f"School Name:  ({school_name_x:.1f}, {school_name_y:.1f})")
        print(f"Date:         ({date_x:.1f}, {date_y:.1f})")
        
        return {
            'page_width': page_width,
            'page_height': page_height,
            'student_name_x': student_name_x,
            'student_name_y': student_name_y,
            'school_name_x': school_name_x,
            'school_name_y': school_name_y,
            'date_x': date_x,
            'date_y': date_y
        }
        
    except Exception as e:
        print(f"Error analyzing certificate: {str(e)}")
        return None

def create_test_certificate():
    """Create a test certificate with grid lines to help visualize positioning."""
    coords = analyze_certificate_layout()
    if not coords:
        return
    
    from PyPDF2 import PdfWriter
    
    # Read template
    reader = PdfReader("E004 Certificate of Achievement.pdf")
    writer = PdfWriter()
    template_page = reader.pages[0]
    
    # Create overlay with grid and test text
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(coords['page_width'], coords['page_height']))
    
    # Draw grid lines for reference (in light colors)
    can.setStrokeColor(red)
    can.setLineWidth(0.5)
    
    # Vertical grid lines every 10%
    for i in range(1, 10):
        x = coords['page_width'] * i / 10
        can.line(x, 0, x, coords['page_height'])
    
    # Horizontal grid lines every 10%
    for i in range(1, 10):
        y = coords['page_height'] * i / 10
        can.line(0, y, coords['page_width'], y)
    
    # Test text positioning
    can.setFillColor(blue)
    can.setFont("Helvetica-Bold", 18)
    can.drawString(coords['student_name_x'], coords['student_name_y'], "TEST STUDENT NAME")
    
    can.setFont("Helvetica", 14)
    can.drawString(coords['school_name_x'], coords['school_name_y'], "Andrew Jackson Elementary School")
    
    can.setFont("Helvetica", 12)
    can.drawString(coords['date_x'], coords['date_y'], "19 November 2025")
    
    can.save()
    packet.seek(0)
    
    # Merge with template
    overlay_reader = PdfReader(packet)
    overlay_page = overlay_reader.pages[0]
    template_page.merge_page(overlay_page)
    writer.add_page(template_page)
    
    # Save test certificate
    with open("test_certificate_positioning.pdf", 'wb') as output_file:
        writer.write(output_file)
    
    print("\nCreated test_certificate_positioning.pdf with grid overlay for positioning reference")

if __name__ == "__main__":
    create_test_certificate()