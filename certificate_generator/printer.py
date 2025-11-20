#!/usr/bin/env python3
"""
Print module for sending PDF certificates to printers.
Supports printer selection and print job management.
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Optional, Dict, TYPE_CHECKING

if TYPE_CHECKING:
    # Type checking imports - only for static analysis
    try:
        import cups  # pyright: ignore[reportMissingImports]
    except ImportError:
        pass

try:
    import cups  # pyright: ignore[reportMissingImports]
    CUPS_AVAILABLE = True
except ImportError:
    CUPS_AVAILABLE = False
    cups = None  # Define cups as None when not available


class PrinterManager:
    """Manage printer operations for certificate printing."""
    
    def __init__(self):
        """Initialize printer manager."""
        self.conn = None
        if CUPS_AVAILABLE and cups is not None:
            try:
                self.conn = cups.Connection()
            except Exception as e:
                print(f"Warning: Could not connect to CUPS: {e}")
                self.conn = None
    
    def get_available_printers(self) -> Dict[str, Dict]:
        """Get list of available printers."""
        printers = {}
        
        if self.conn:
            try:
                printers = self.conn.getPrinters()
            except Exception as e:
                print(f"Error getting printers via CUPS: {e}")
        
        # Fallback to system commands if CUPS not available
        if not printers:
            printers = self._get_printers_fallback()
        
        return printers
    
    def _get_printers_fallback(self) -> Dict[str, Dict]:
        """Fallback method to get printers using system commands."""
        printers = {}
        
        try:
            # Try lpstat command (Linux/Unix)
            result = subprocess.run(['lpstat', '-p'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if line.startswith('printer'):
                        parts = line.split()
                        if len(parts) >= 2:
                            printer_name = parts[1]
                            status = 'idle' if 'idle' in line else 'unknown'
                            printers[printer_name] = {
                                'device-uri': 'unknown',
                                'printer-info': printer_name,
                                'printer-state': status,
                                'printer-state-message': line
                            }
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            # Try lpoptions command
            try:
                result = subprocess.run(['lpoptions', '-d'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    default_printer = result.stdout.strip()
                    if default_printer:
                        printers[default_printer] = {
                            'device-uri': 'unknown',
                            'printer-info': f'{default_printer} (default)',
                            'printer-state': 'idle',
                            'printer-state-message': 'Default printer'
                        }
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                pass
        
        return printers
    
    def list_printers(self) -> None:
        """Display available printers."""
        printers = self.get_available_printers()
        
        if not printers:
            print("No printers found!")
            print("\nTroubleshooting:")
            print("1. Make sure CUPS is installed: sudo apt-get install cups")
            print("2. Make sure you have printers configured")
            print("3. Check printer status: lpstat -p")
            return
        
        print("Available printers:")
        print("-" * 50)
        
        for i, (name, info) in enumerate(printers.items(), 1):
            status = info.get('printer-state', 'unknown')
            description = info.get('printer-info', name)
            print(f"{i}. {name}")
            print(f"   Description: {description}")
            print(f"   Status: {status}")
            print()
    
    def select_printer(self) -> Optional[str]:
        """Interactive printer selection."""
        printers = self.get_available_printers()
        
        if not printers:
            print("No printers available!")
            return None
        
        printer_list = list(printers.keys())
        
        if len(printer_list) == 1:
            printer_name = printer_list[0]
            print(f"Using only available printer: {printer_name}")
            return printer_name
        
        print("\nAvailable printers:")
        for i, name in enumerate(printer_list, 1):
            info = printers[name]
            description = info.get('printer-info', name)
            status = info.get('printer-state', 'unknown')
            print(f"{i}. {name} - {description} ({status})")
        
        while True:
            try:
                choice = input(f"\nSelect printer (1-{len(printer_list)}) or 'q' to quit: ").strip()
                
                if choice.lower() == 'q':
                    return None
                
                index = int(choice) - 1
                if 0 <= index < len(printer_list):
                    selected = printer_list[index]
                    print(f"Selected printer: {selected}")
                    return selected
                else:
                    print(f"Please enter a number between 1 and {len(printer_list)}")
                    
            except ValueError:
                print("Please enter a valid number or 'q' to quit")
            except KeyboardInterrupt:
                print("\nCancelled by user")
                return None
    
    def print_pdf(self, pdf_path: str, printer_name: str, job_name: Optional[str] = None) -> bool:
        """Print a PDF file to the specified printer."""
        if not os.path.exists(pdf_path):
            print(f"Error: File {pdf_path} not found!")
            return False
        
        if not job_name:
            job_name = f"Certificate - {Path(pdf_path).stem}"
        
        success = False
        
        # Try CUPS first
        if self.conn:
            try:
                job_id = self.conn.printFile(printer_name, pdf_path, job_name, {})
                print(f"Print job {job_id} sent to {printer_name}")
                success = True
            except Exception as e:
                print(f"CUPS printing failed: {e}")
        
        # Fallback to system commands
        if not success:
            try:
                # Try lpr command
                cmd = ['lpr', '-P', printer_name, pdf_path]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    print(f"Print job sent to {printer_name} successfully")
                    success = True
                else:
                    print(f"Print command failed: {result.stderr}")
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError) as e:
                print(f"System print command failed: {e}")
        
        return success
    
    def print_multiple_pdfs(self, pdf_paths: List[str], printer_name: str) -> Dict[str, bool]:
        """Print multiple PDF files to the specified printer."""
        results = {}
        
        print(f"\nPrinting {len(pdf_paths)} certificates to {printer_name}...")
        
        for i, pdf_path in enumerate(pdf_paths, 1):
            print(f"Printing {i}/{len(pdf_paths)}: {Path(pdf_path).name}")
            
            success = self.print_pdf(pdf_path, printer_name)
            results[pdf_path] = success
            
            if not success:
                print(f"Failed to print: {pdf_path}")
        
        # Summary
        successful = sum(1 for success in results.values() if success)
        failed = len(pdf_paths) - successful
        
        print(f"\nPrint Summary:")
        print(f"✅ Successful: {successful}")
        if failed > 0:
            print(f"❌ Failed: {failed}")
        
        return results


def main():
    """Test the printer functionality."""
    printer_manager = PrinterManager()
    
    print("Certificate Printer Test")
    print("=" * 40)
    
    # List available printers
    printer_manager.list_printers()
    
    # Test printer selection
    selected_printer = printer_manager.select_printer()
    
    if selected_printer:
        print(f"\nSelected printer: {selected_printer}")
        
        # Look for sample PDFs to print
        sample_pdf_dir = Path("output/certificates")
        if sample_pdf_dir.exists():
            pdf_files = list(sample_pdf_dir.glob("*.pdf"))
            if pdf_files:
                print(f"\nFound {len(pdf_files)} certificate files")
                
                # Ask if user wants to print them
                response = input("Print all certificates? (y/n): ").strip().lower()
                if response == 'y':
                    printer_manager.print_multiple_pdfs([str(f) for f in pdf_files], selected_printer)
                else:
                    print("Print cancelled")
            else:
                print("No certificate PDFs found in output/certificates")
        else:
            print("No output directory found")
    else:
        print("No printer selected")


if __name__ == "__main__":
    main()