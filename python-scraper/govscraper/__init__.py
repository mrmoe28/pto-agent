"""
Government website scraper for Planning & Building departments
Extracts permit fees, processing instructions, turnaround times, and contact information
"""

__version__ = "1.0.0"
__author__ = "Claude Code"

from .models import GovRecord, Download
from .config import Config
from .runner import crawl

__all__ = ["GovRecord", "Download", "Config", "crawl"]
