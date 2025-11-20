#!/usr/bin/env python3
"""Setup script for JA Certificate Generator."""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding='utf-8')

# Read requirements
requirements = []
with open('requirements.txt', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            requirements.append(line)

setup(
    name="ja-certificate-generator",
    version="1.0.0",
    author="JA Certificate Completion Project",
    description="A comprehensive tool for generating personalized Junior Achievement certificates",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Education",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Education",
        "Topic :: Office/Business",
        "Topic :: Printing",
    ],
    license="MIT",
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        'dev': [
            'pytest>=7.0.0',
            'pytest-cov>=4.0.0',
            'flake8>=6.0.0',
            'black>=23.0.0',
        ],
        'ocr': [
            'pytesseract>=0.3.10',
        ]
    },
    entry_points={
        'console_scripts': [
            'ja-cert-gen=certificate_generator.cli:main',
        ],
    },
    include_package_data=True,
    zip_safe=False,
)