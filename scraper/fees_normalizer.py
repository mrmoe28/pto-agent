"""
Fee information normalization and summarization.
"""
import re
from typing import List, Dict, Any, Optional
from .utils import clean_text


def extract_fee_amounts(text: str) -> List[str]:
    """Extract monetary amounts from text."""
    # Patterns for different currency formats
    money_patterns = [
        r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?',  # $1,000.00, $500, etc.
        r'\$\d+\.?\d*',  # $100, $50.50, etc.
        r'\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*dollars?',  # 100 dollars
        r'\d+\.\d{2}\s*(?:USD|usd|\$)',  # 50.00 USD
    ]

    amounts = []
    for pattern in money_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        amounts.extend(matches)

    return amounts


def extract_fee_types(text: str) -> List[str]:
    """Extract fee types and categories from text."""
    fee_type_patterns = [
        r'(building permit|electrical permit|plumbing permit|mechanical permit)',
        r'(plan review|plan check|review fee)',
        r'(inspection fee|reinspection fee)',
        r'(commercial|residential)',
        r'(single family|multi[- ]family)',
        r'(new construction|renovation|addition|alteration)',
        r'(square foot|sq\.?\s*ft\.?|sf)',
        r'(valuation|value)',
        r'(zoning|variance|conditional use)',
        r'(demolition|grading|excavation)',
    ]

    fee_types = []
    for pattern in fee_type_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        fee_types.extend([match.lower() for match in matches])

    return list(set(fee_types))  # Remove duplicates


def analyze_fee_table(table: List[List[str]]) -> Dict[str, Any]:
    """Analyze a fee table structure and extract key information."""
    if not table or len(table) < 2:
        return {}

    analysis = {
        'rows': len(table),
        'columns': len(table[0]) if table else 0,
        'headers': [],
        'fee_columns': [],
        'description_columns': [],
        'sample_fees': [],
        'fee_types': []
    }

    if table:
        headers = [clean_text(str(cell)) for cell in table[0]]
        analysis['headers'] = headers

        # Identify fee and description columns
        for i, header in enumerate(headers):
            header_lower = header.lower()
            if any(keyword in header_lower for keyword in ['fee', 'cost', 'amount', 'price', '$']):
                analysis['fee_columns'].append(i)
            elif any(keyword in header_lower for keyword in ['description', 'type', 'permit', 'service']):
                analysis['description_columns'].append(i)

        # Extract sample data
        for row in table[1:6]:  # Sample first 5 data rows
            row_text = ' '.join([clean_text(str(cell)) for cell in row])
            amounts = extract_fee_amounts(row_text)
            if amounts:
                analysis['sample_fees'].extend(amounts[:2])  # Limit to 2 per row

            fee_types = extract_fee_types(row_text)
            analysis['fee_types'].extend(fee_types)

        # Remove duplicates and limit
        analysis['sample_fees'] = list(set(analysis['sample_fees']))[:5]
        analysis['fee_types'] = list(set(analysis['fee_types']))[:5]

    return analysis


def summarize_fee_table(table: List[List[str]]) -> str:
    """Create a human-readable summary of a fee table."""
    analysis = analyze_fee_table(table)

    if not analysis:
        return "Empty fee table"

    summary_parts = []

    # Basic structure
    summary_parts.append(f"Fee table with {analysis['rows']} rows, {analysis['columns']} columns")

    # Headers
    if analysis['headers']:
        headers_text = ', '.join(analysis['headers'][:3])
        if len(analysis['headers']) > 3:
            headers_text += f" (and {len(analysis['headers']) - 3} more)"
        summary_parts.append(f"Columns: {headers_text}")

    # Sample fees
    if analysis['sample_fees']:
        fees_text = ', '.join(analysis['sample_fees'][:3])
        summary_parts.append(f"Sample fees: {fees_text}")

    # Fee types
    if analysis['fee_types']:
        types_text = ', '.join(analysis['fee_types'][:3])
        summary_parts.append(f"Types: {types_text}")

    return ' | '.join(summary_parts)


def extract_fee_bullets_from_text(text: str) -> List[str]:
    """Extract fee-related bullet points from text."""
    bullets = []

    # Split text into sentences/lines
    lines = re.split(r'[.\n\r]', text)

    for line in lines:
        line = clean_text(line)
        if not line or len(line) < 10:
            continue

        # Check if line contains fee information
        if any(keyword in line.lower() for keyword in ['fee', 'cost', 'charge', '$']):
            # Extract monetary amounts
            amounts = extract_fee_amounts(line)
            if amounts:
                bullets.append(line[:150])  # Truncate long lines

    return bullets[:6]  # Limit to 6 bullets


def summarize_fees(tables: List[List[List[str]]], text: str = "") -> List[str]:
    """
    Summarize fee information from tables and text into bullet points.
    Returns up to 12 bullet points.
    """
    bullets = []

    # Process tables
    for table in tables[:3]:  # Limit to first 3 tables
        if table and len(table) > 1:
            table_summary = summarize_fee_table(table)
            bullets.append(f"• {table_summary}")

    # Process text
    if text:
        text_bullets = extract_fee_bullets_from_text(text)
        for bullet in text_bullets:
            bullets.append(f"• {bullet}")

    # Remove duplicates while preserving order
    seen = set()
    unique_bullets = []
    for bullet in bullets:
        bullet_lower = bullet.lower()
        if bullet_lower not in seen:
            seen.add(bullet_lower)
            unique_bullets.append(bullet)

    # Limit to 12 bullets
    return unique_bullets[:12]


def normalize_fee_text(text: str) -> str:
    """Normalize fee text for consistency."""
    if not text:
        return ""

    # Clean up common formatting issues
    text = re.sub(r'\s+', ' ', text)  # Multiple spaces to single
    text = re.sub(r'(\d)\s*-\s*(\d)', r'\1-\2', text)  # Fix number ranges
    text = re.sub(r'\$\s+(\d)', r'$\1', text)  # Fix $ spacing

    # Standardize common terms
    replacements = {
        r'\bsq\.?\s*ft\.?\b': 'sq ft',
        r'\bper\s+sq\.?\s*ft\.?\b': 'per sq ft',
        r'\bcommercial\b': 'commercial',
        r'\bresidential\b': 'residential',
        r'\bplan\s+review\b': 'plan review',
        r'\bplan\s+check\b': 'plan review',
    }

    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    return text.strip()


def detect_fee_structure(text: str, tables: List[List[List[str]]]) -> Dict[str, Any]:
    """Detect the type of fee structure (flat, tiered, percentage, etc.)."""
    structure = {
        'type': 'unknown',
        'indicators': [],
        'complexity': 'simple'
    }

    combined_text = text.lower()
    for table in tables:
        for row in table:
            combined_text += ' ' + ' '.join([str(cell).lower() for cell in row])

    # Detect structure types
    if any(indicator in combined_text for indicator in ['minimum', 'maximum', 'up to', 'or more']):
        structure['type'] = 'tiered'
        structure['indicators'].append('min/max ranges')

    if any(indicator in combined_text for indicator in ['percent', '%', 'percentage']):
        structure['type'] = 'percentage'
        structure['indicators'].append('percentage-based')

    if any(indicator in combined_text for indicator in ['per sq ft', 'per square foot', 'per unit']):
        structure['type'] = 'unit-based'
        structure['indicators'].append('unit-based pricing')

    if any(indicator in combined_text for indicator in ['valuation', 'construction value']):
        structure['type'] = 'valuation-based'
        structure['indicators'].append('based on construction value')

    # Detect complexity
    fee_count = len(extract_fee_amounts(combined_text))
    table_count = len([t for t in tables if len(t) > 2])

    if fee_count > 10 or table_count > 2:
        structure['complexity'] = 'complex'
    elif fee_count > 5 or table_count > 1:
        structure['complexity'] = 'moderate'

    return structure