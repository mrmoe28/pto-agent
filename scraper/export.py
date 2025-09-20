"""
Export functionality for crawled permit data.
"""
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from collections import Counter

from .models import Record
from .config import EXPORTS_DIR


def calculate_coverage_metrics(records: List[Record]) -> Dict[str, Any]:
    """Calculate field coverage and platform statistics."""
    if not records:
        return {}

    total_records = len(records)
    field_counts = Counter()
    platform_counts = Counter()

    for record in records:
        # Count non-empty fields
        data = record.model_dump()
        for field, value in data.items():
            if field == 'confidence':
                continue
            if value and value != "Unknown" and value != []:
                field_counts[field] += 1

        # Count platforms
        platform_counts[record.platform] += 1

    # Calculate percentages
    field_coverage = {
        field: {
            'count': count,
            'percentage': round((count / total_records) * 100, 2)
        }
        for field, count in field_counts.items()
    }

    # Platform statistics
    platform_stats = {
        platform: {
            'count': count,
            'percentage': round((count / total_records) * 100, 2)
        }
        for platform, count in platform_counts.items()
    }

    return {
        'total_records': total_records,
        'field_coverage': field_coverage,
        'platform_distribution': platform_stats,
        'average_confidence': round(sum(r.confidence for r in records) / total_records, 3) if records else 0
    }


def merge_duplicates(records: List[Record]) -> List[Record]:
    """
    Merge duplicate records by (state, county, city, department_name).
    Prefers higher confidence and longer non-boilerplate field values.
    """
    # Group records by jurisdiction key
    groups = {}

    for record in records:
        key = (
            record.state or "",
            record.county or "",
            record.city or "",
            record.department_name or ""
        )

        if key not in groups:
            groups[key] = []
        groups[key].append(record)

    # Merge each group
    merged_records = []

    for key, group_records in groups.items():
        if len(group_records) == 1:
            merged_records.append(group_records[0])
            continue

        # Sort by confidence (highest first)
        group_records.sort(key=lambda r: r.confidence, reverse=True)

        # Start with highest confidence record
        best_record = group_records[0]
        merged_data = best_record.model_dump()

        # Merge fields from other records
        for record in group_records[1:]:
            record_data = record.model_dump()

            for field, value in record_data.items():
                if field in ['source_url', 'discovered_via', 'last_checked_at']:
                    continue  # Keep from best record

                if not merged_data.get(field) and value:
                    merged_data[field] = value
                elif field in ['permit_fee', 'processing_instructions'] and value:
                    # Merge text fields with longer content
                    current_val = merged_data.get(field, '')
                    if len(str(value)) > len(str(current_val)):
                        merged_data[field] = value
                elif field == 'downloadable_applications' and value:
                    # Merge download lists
                    current_downloads = merged_data.get(field, [])
                    if len(value) > len(current_downloads):
                        merged_data[field] = value

        # Create merged record
        merged_record = Record(**merged_data)
        merged_records.append(merged_record)

    return merged_records


def export_csv(records: List[Record], output_path: Path):
    """Export records to CSV format."""
    if not records:
        return

    # Get all field names
    fieldnames = list(records[0].model_dump().keys())

    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for record in records:
            row = record.to_row()
            # Convert lists to string representation
            for key, value in row.items():
                if isinstance(value, list):
                    if key == 'downloadable_applications':
                        row[key] = ' | '.join(str(item) for item in value)
                    else:
                        row[key] = ', '.join(str(item) for item in value)
            writer.writerow(row)


def export_json(records: List[Record], output_path: Path):
    """Export records to JSON format."""
    data = [record.model_dump() for record in records]

    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, indent=2, default=str)


def truncate_long_summaries(records: List[Record], max_bullets: int = 12) -> List[Record]:
    """Truncate very long permit_fee summaries."""
    for record in records:
        if record.permit_fee and len(record.permit_fee) > 1000:
            # Split by bullet points or pipe separators
            parts = record.permit_fee.split(' | ')
            if len(parts) > max_bullets:
                record.permit_fee = ' | '.join(parts[:max_bullets]) + " (see source for complete details)"

    return records


def generate_export_report(records: List[Record], metrics: Dict[str, Any]) -> str:
    """Generate a summary report of the export."""
    report_lines = [
        "# Permit Data Export Report",
        f"Generated: {datetime.utcnow().isoformat()}",
        "",
        "## Summary Statistics",
        f"Total Records: {metrics['total_records']}",
        f"Average Confidence: {metrics['average_confidence']}",
        "",
        "## Field Coverage",
    ]

    # Field coverage table
    coverage = metrics['field_coverage']
    for field, stats in sorted(coverage.items(), key=lambda x: x[1]['percentage'], reverse=True):
        report_lines.append(f"- {field}: {stats['count']} records ({stats['percentage']}%)")

    report_lines.extend([
        "",
        "## Platform Distribution",
    ])

    # Platform distribution
    platforms = metrics['platform_distribution']
    for platform, stats in sorted(platforms.items(), key=lambda x: x[1]['count'], reverse=True):
        report_lines.append(f"- {platform}: {stats['count']} records ({stats['percentage']}%)")

    # State coverage
    state_counts = Counter(r.state for r in records if r.state and r.state != "Unknown")
    if state_counts:
        report_lines.extend([
            "",
            "## State Coverage",
        ])
        for state, count in state_counts.most_common(10):
            report_lines.append(f"- {state}: {count} records")

    return "\n".join(report_lines)


def export_data(records: List[Record], output_dir: Path = EXPORTS_DIR,
                merge_duplicates_flag: bool = True) -> Dict[str, Any]:
    """
    Export crawled records to CSV and JSON with coverage metrics.

    Args:
        records: List of Record objects to export
        output_dir: Directory to save exports
        merge_duplicates_flag: Whether to merge duplicate records

    Returns:
        Dictionary with export paths and metrics
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    if not records:
        return {'error': 'No records to export'}

    # Process records
    processed_records = records.copy()

    # Merge duplicates if requested
    if merge_duplicates_flag:
        processed_records = merge_duplicates(processed_records)

    # Truncate long summaries
    processed_records = truncate_long_summaries(processed_records)

    # Calculate metrics
    metrics = calculate_coverage_metrics(processed_records)

    # Generate filenames with timestamp
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    csv_path = output_dir / f"us_permits_{timestamp}.csv"
    json_path = output_dir / f"us_permits_{timestamp}.json"
    report_path = output_dir / f"export_report_{timestamp}.md"

    # Export data
    export_csv(processed_records, csv_path)
    export_json(processed_records, json_path)

    # Generate and save report
    report_content = generate_export_report(processed_records, metrics)
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)

    return {
        'csv_path': str(csv_path),
        'json_path': str(json_path),
        'report_path': str(report_path),
        'metrics': metrics,
        'original_count': len(records),
        'exported_count': len(processed_records),
        'duplicates_merged': len(records) - len(processed_records) if merge_duplicates_flag else 0
    }