"""
Data persistence for government scraper results
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import List, Set, Dict, Any
import pandas as pd
import orjson
from slugify import slugify

from .models import GovRecord

logger = logging.getLogger(__name__)

class DataPersister:
    """Persist government scraper results to various formats"""
    
    def __init__(self, out_dir: str, formats: List[str] = None):
        self.out_dir = Path(out_dir)
        # Handle formats that might come as a single string with comma separation
        if formats and len(formats) == 1 and ',' in formats[0]:
            self.formats = [f.strip() for f in formats[0].split(',')]
        else:
            self.formats = formats or ['jsonl', 'csv']
        
        # Create output directory
        self.out_dir.mkdir(parents=True, exist_ok=True)
        
        # Track seen records to avoid duplicates
        self.seen_records: Set[str] = set()
        
        # Initialize writers
        self.jsonl_writer = None
        self.csv_data = []
        self.jsonl_path = None
    
    async def __aenter__(self):
        """Initialize persistence"""
        if 'jsonl' in self.formats:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            self.jsonl_path = self.out_dir / f"gov_scraper_results_{timestamp}.jsonl"
            self.jsonl_writer = open(self.jsonl_path, 'w', encoding='utf-8')
            logger.info(f"JSONL output: {self.jsonl_path}")
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up persistence"""
        if self.jsonl_writer:
            self.jsonl_writer.close()
        
        if 'csv' in self.formats and self.csv_data:
            await self._write_csv()
    
    async def save_record(self, record: GovRecord) -> bool:
        """Save a single record"""
        try:
            # Check if record has valuable data
            if not record.has_valuable_data():
                logger.debug(f"Skipping record with no valuable data: {record.source_url}")
                return False
            
            # Create record hash to avoid duplicates
            record_hash = self._create_record_hash(record)
            if record_hash in self.seen_records:
                logger.debug(f"Skipping duplicate record: {record.source_url}")
                return False
            
            self.seen_records.add(record_hash)
            
            # Save to JSONL
            if self.jsonl_writer:
                json_data = record.to_dict()
                json_line = orjson.dumps(json_data).decode('utf-8')
                self.jsonl_writer.write(json_line + '\n')
                self.jsonl_writer.flush()
            
            # Add to CSV data
            if 'csv' in self.formats:
                self.csv_data.append(self._record_to_csv_row(record))
            
            logger.info(f"Saved record: {record.jurisdiction_name or 'Unknown'} - {record.source_url}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving record {record.source_url}: {e}")
            return False
    
    async def save_records(self, records: List[GovRecord]) -> int:
        """Save multiple records"""
        saved_count = 0
        for record in records:
            if await self.save_record(record):
                saved_count += 1
        return saved_count
    
    async def _write_csv(self):
        """Write CSV file"""
        try:
            if not self.csv_data:
                return
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            csv_path = self.out_dir / f"gov_scraper_results_{timestamp}.csv"
            
            df = pd.DataFrame(self.csv_data)
            df.to_csv(csv_path, index=False, encoding='utf-8')
            
            logger.info(f"CSV output: {csv_path} ({len(self.csv_data)} records)")
            
        except Exception as e:
            logger.error(f"Error writing CSV: {e}")
    
    def _create_record_hash(self, record: GovRecord) -> str:
        """Create hash for record deduplication"""
        # Use source URL and key field values for hashing
        hash_data = {
            'url': str(record.source_url),
            'jurisdiction': record.jurisdiction_name,
            'fee': record.permit_fee,
            'instructions': record.processing_instructions,
            'turnaround': record.turnaround_time,
            'phone': record.phone,
            'email': record.email,
            'address': record.address
        }
        
        # Create hash from non-None values
        hash_string = '|'.join(f"{k}:{v}" for k, v in hash_data.items() if v is not None)
        return str(hash(hash_string))
    
    def _record_to_csv_row(self, record: GovRecord) -> Dict[str, Any]:
        """Convert record to CSV row"""
        return {
            'jurisdiction_name': record.jurisdiction_name,
            'source_url': str(record.source_url),
            'permit_fee': record.permit_fee,
            'processing_instructions': record.processing_instructions,
            'turnaround_time': record.turnaround_time,
            'phone': record.phone,
            'email': record.email,
            'address': record.address,
            'downloadable_applications_count': len(record.downloadable_applications),
            'downloadable_applications': '; '.join([
                f"{app.name} ({app.href})" for app in record.downloadable_applications
            ]),
            'last_scraped_at': record.last_scraped_at.isoformat(),
            'notes': record.notes
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get persistence statistics"""
        return {
            'total_records': len(self.seen_records),
            'formats': self.formats,
            'output_directory': str(self.out_dir)
        }
    
    async def create_summary_report(self) -> str:
        """Create a summary report of scraped data"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_path = self.out_dir / f"scraping_summary_{timestamp}.txt"
            
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write("Government Scraper Summary Report\n")
                f.write("=" * 50 + "\n\n")
                f.write(f"Generated: {datetime.now().isoformat()}\n")
                f.write(f"Total Records: {len(self.seen_records)}\n")
                f.write(f"Output Formats: {', '.join(self.formats)}\n")
                f.write(f"Output Directory: {self.out_dir}\n\n")
                
                # Count records by data type
                if self.csv_data:
                    df = pd.DataFrame(self.csv_data)
                    
                    f.write("Data Coverage:\n")
                    f.write("-" * 20 + "\n")
                    f.write(f"Records with fees: {len(df[df['permit_fee'].notna()])}\n")
                    f.write(f"Records with instructions: {len(df[df['processing_instructions'].notna()])}\n")
                    f.write(f"Records with turnaround times: {len(df[df['turnaround_time'].notna()])}\n")
                    f.write(f"Records with phone numbers: {len(df[df['phone'].notna()])}\n")
                    f.write(f"Records with email addresses: {len(df[df['email'].notna()])}\n")
                    f.write(f"Records with addresses: {len(df[df['address'].notna()])}\n")
                    f.write(f"Records with downloadable applications: {len(df[df['downloadable_applications_count'] > 0])}\n\n")
                    
                    # Top jurisdictions
                    if 'jurisdiction_name' in df.columns:
                        top_jurisdictions = df['jurisdiction_name'].value_counts().head(10)
                        f.write("Top Jurisdictions:\n")
                        f.write("-" * 20 + "\n")
                        for jurisdiction, count in top_jurisdictions.items():
                            f.write(f"{jurisdiction}: {count} records\n")
            
            logger.info(f"Summary report: {report_path}")
            return str(report_path)
            
        except Exception as e:
            logger.error(f"Error creating summary report: {e}")
            return ""
