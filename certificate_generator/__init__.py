"""
JA Certificate Generator Package

A comprehensive tool for generating personalized Junior Achievement certificates
from various input file formats.
"""

__version__ = "1.0.0"
__author__ = "JA Certificate Completion Project"
__license__ = "MIT"

from .file_reader import StudentNameExtractor
from .certificate_generator import CertificateGenerator
from . import cli

try:
    from .printer import PrinterManager
    __all__ = ["StudentNameExtractor", "CertificateGenerator", "cli", "PrinterManager"]
except ImportError:
    __all__ = ["StudentNameExtractor", "CertificateGenerator", "cli"]