"""
PDF content extraction using multiple libraries as fallbacks.
"""
import io
import tempfile
import os
from typing import List, Dict, Optional, Tuple
from pathlib import Path

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import camelot
    HAS_CAMELOT = True
except ImportError:
    HAS_CAMELOT = False

try:
    import tabula
    HAS_TABULA = True
except ImportError:
    HAS_TABULA = False

try:
    from pdfminer.high_level import extract_text
    HAS_PDFMINER = True
except ImportError:
    HAS_PDFMINER = False

import requests
from .utils import get
from .config import MAX_PDF_SIZE_MB


def download_pdf(url: str) -> Optional[bytes]:
    """Download PDF content from URL with size limit."""
    try:
        response = get(url, stream=True)

        # Check content length
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) > MAX_PDF_SIZE_MB * 1024 * 1024:
            return None

        # Download with size limit
        content = b''
        for chunk in response.iter_content(chunk_size=8192):
            content += chunk
            if len(content) > MAX_PDF_SIZE_MB * 1024 * 1024:
                return None

        return content
    except Exception:
        return None


def extract_text_pdfplumber(pdf_content: bytes) -> Tuple[str, List[List[List[str]]]]:
    """Extract text and tables using pdfplumber."""
    if not HAS_PDFPLUMBER:
        return "", []

    text = ""
    tables = []

    try:
        with io.BytesIO(pdf_content) as pdf_buffer:
            with pdfplumber.open(pdf_buffer) as pdf:
                for page in pdf.pages:
                    # Extract text
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

                    # Extract tables
                    page_tables = page.extract_tables()
                    if page_tables:
                        tables.extend(page_tables)
    except Exception:
        pass

    return text, tables


def extract_tables_camelot(pdf_content: bytes) -> List[List[List[str]]]:
    """Extract tables using camelot."""
    if not HAS_CAMELOT:
        return []

    tables = []

    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            tmp_file.write(pdf_content)
            tmp_file.flush()

            # Try lattice method first (better for bordered tables)
            try:
                camelot_tables = camelot.read_pdf(tmp_file.name, flavor='lattice')
                for table in camelot_tables:
                    tables.append(table.df.values.tolist())
            except:
                # Fallback to stream method (better for borderless tables)
                try:
                    camelot_tables = camelot.read_pdf(tmp_file.name, flavor='stream')
                    for table in camelot_tables:
                        tables.append(table.df.values.tolist())
                except:
                    pass

    except Exception:
        pass
    finally:
        try:
            os.unlink(tmp_file.name)
        except:
            pass

    return tables


def extract_tables_tabula(pdf_content: bytes) -> List[List[List[str]]]:
    """Extract tables using tabula."""
    if not HAS_TABULA:
        return []

    tables = []

    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            tmp_file.write(pdf_content)
            tmp_file.flush()

            # Extract tables from all pages
            dfs = tabula.read_pdf(tmp_file.name, pages='all', multiple_tables=True)
            for df in dfs:
                # Convert DataFrame to list of lists
                table_data = df.fillna('').values.tolist()
                # Add header row
                headers = df.columns.tolist()
                table_data.insert(0, headers)
                tables.append(table_data)

    except Exception:
        pass
    finally:
        try:
            os.unlink(tmp_file.name)
        except:
            pass

    return tables


def extract_text_pdfminer(pdf_content: bytes) -> str:
    """Extract text using pdfminer."""
    if not HAS_PDFMINER:
        return ""

    try:
        with io.BytesIO(pdf_content) as pdf_buffer:
            text = extract_text(pdf_buffer)
            return text or ""
    except Exception:
        return ""


def extract_pdf_content(url_or_content) -> Dict[str, any]:
    """
    Extract text and tables from PDF using multiple libraries as fallbacks.

    Args:
        url_or_content: Either a URL string or bytes content

    Returns:
        Dict with 'text', 'tables', and 'success' keys
    """
    result = {
        'text': '',
        'tables': [],
        'success': False,
        'method': None
    }

    # Get PDF content
    if isinstance(url_or_content, str):
        # It's a URL
        pdf_content = download_pdf(url_or_content)
        if not pdf_content:
            return result
    else:
        # It's already bytes content
        pdf_content = url_or_content

    # Try pdfplumber first (most reliable for both text and tables)
    if HAS_PDFPLUMBER:
        text, tables = extract_text_pdfplumber(pdf_content)
        if text or tables:
            result['text'] = text
            result['tables'] = tables
            result['success'] = True
            result['method'] = 'pdfplumber'
            return result

    # Fallback to camelot for tables + pdfminer for text
    if HAS_CAMELOT or HAS_PDFMINER:
        text = ""
        tables = []

        if HAS_PDFMINER:
            text = extract_text_pdfminer(pdf_content)

        if HAS_CAMELOT:
            tables = extract_tables_camelot(pdf_content)

        if text or tables:
            result['text'] = text
            result['tables'] = tables
            result['success'] = True
            result['method'] = 'camelot+pdfminer'
            return result

    # Last resort: tabula for tables
    if HAS_TABULA:
        tables = extract_tables_tabula(pdf_content)
        if tables:
            result['tables'] = tables
            result['success'] = True
            result['method'] = 'tabula'
            return result

    return result


def get_available_extractors() -> List[str]:
    """Get list of available PDF extraction libraries."""
    available = []
    if HAS_PDFPLUMBER:
        available.append('pdfplumber')
    if HAS_CAMELOT:
        available.append('camelot')
    if HAS_TABULA:
        available.append('tabula')
    if HAS_PDFMINER:
        available.append('pdfminer')
    return available