#!/usr/bin/env python3
"""
Script to create a coordinate mapping overlay on the certificate.
This will help identify the exact positions for text placement.
"""

from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red, blue, green, black
import io

def create_coordinate_overlay(page_width, page_height):
    """Create a PDF overlay with coordinate grid and markers."""
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Set up colors
    can.setStrokeColor(red)
    can.setFillColor(red)
    
    # Draw grid lines every 50 points
    can.setLineWidth(0.5)
    
    # Vertical lines
    for x in range(0, int(page_width), 50):
        can.line(x, 0, x, page_height)
        # Add coordinate labels
        if x % 100 == 0:  # Every 100 points
            can.setFont("Helvetica", 8)
            can.drawString(x + 2, page_height - 20, str(x))
    
    # Horizontal lines
    for y in range(0, int(page_height), 50):
        can.line(0, y, page_width, y)
        # Add coordinate labels
        if y % 100 == 0:  # Every 100 points
            can.setFont("Helvetica", 8)
            can.drawString(5, y + 2, str(y))
    
    # Add center lines in different color
    can.setStrokeColor(blue)
    can.setLineWidth(2)
    
    # Center vertical line
    center_x = page_width / 2
    can.line(center_x, 0, center_x, page_height)
    
    # Center horizontal line
    center_y = page_height / 2
    can.line(0, center_y, page_width, center_y)
    
    # Add center point marker
    can.setFillColor(blue)
    can.circle(center_x, center_y, 5, fill=1)
    
    # Add coordinate labels for center
    can.setFont("Helvetica-Bold", 12)
    can.setFillColor(blue)
    can.drawString(center_x + 10, center_y + 10, f"CENTER: ({int(center_x)}, {int(center_y)})")
    
    # Add corner markers with coordinates
    can.setFillColor(green)
    can.setFont("Helvetica-Bold", 10)
    
    # Bottom left
    can.drawString(10, 10, f"(0, 0)")
    can.circle(5, 5, 3, fill=1)
    
    # Top left
    can.drawString(10, page_height - 25, f"(0, {int(page_height)})")
    can.circle(5, page_height - 5, 3, fill=1)
    
    # Bottom right
    can.drawString(page_width - 80, 10, f"({int(page_width)}, 0)")
    can.circle(page_width - 5, 5, 3, fill=1)
    
    # Top right
    can.drawString(page_width - 120, page_height - 25, f"({int(page_width)}, {int(page_height)})")
    can.circle(page_width - 5, page_height - 5, 3, fill=1)
    
    # Add sample text at various common positions for reference
    can.setFillColor(black)
    can.setFont("Helvetica", 12)
    
    # Some reference positions
    reference_positions = [
        (center_x, 400, "Y=400"),
        (center_x, 350, "Y=350"),
        (center_x, 300, "Y=300"),
        (center_x, 250, "Y=250"),
        (center_x, 200, "Y=200"),
        (center_x, 150, "Y=150"),
        (center_x, 100, "Y=100"),
    ]
    
    for x, y, label in reference_positions:
        text_width = can.stringWidth(label, "Helvetica", 12)
        can.drawString(x - text_width/2, y, label)
        # Add a small marker
        can.setFillColor(red)
        can.circle(x, y - 5, 2, fill=1)
        can.setFillColor(black)
    
    # Add title
    can.setFont("Helvetica-Bold", 16)
    can.setFillColor(red)
    title = "COORDINATE MAPPING OVERLAY"
    title_width = can.stringWidth(title, "Helvetica-Bold", 16)
    can.drawString(center_x - title_width/2, page_height - 50, title)
    
    can.save()
    packet.seek(0)
    return packet

def create_coordinate_mapped_certificate():
    """Create a certificate with coordinate overlay."""
    template_path = "E004 Certificate of Achievement.pdf"
    output_path = "coordinate_mapped_certificate.pdf"
    
    try:
        # Read the template PDF
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Get the first page
        template_page = reader.pages[0]
        page_width = float(template_page.mediabox.width)
        page_height = float(template_page.mediabox.height)
        
        print(f"Certificate dimensions: {page_width} x {page_height} points")
        print(f"Certificate dimensions in inches: {page_width/72:.2f} x {page_height/72:.2f}")
        
        # Create coordinate overlay
        overlay_packet = create_coordinate_overlay(page_width, page_height)
        overlay_reader = PdfReader(overlay_packet)
        overlay_page = overlay_reader.pages[0]
        
        # Merge the overlay with the template
        template_page.merge_page(overlay_page)
        writer.add_page(template_page)
        
        # Write the output PDF
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
            
        print(f"\nCoordinate mapped certificate created: {output_path}")
        print("\nInstructions:")
        print("1. Open the generated PDF")
        print("2. Look for the 'Student Name', 'School Name', and 'Date' lines on the certificate")
        print("3. Note the Y-coordinates where each line appears")
        print("4. The X-coordinate for centering should be near the center line (blue)")
        print("5. Report back the Y-coordinates for each field")
        
        return True
        
    except Exception as e:
        print(f"Error creating coordinate mapped certificate: {str(e)}")
        return False

if __name__ == "__main__":
    create_coordinate_mapped_certificate()