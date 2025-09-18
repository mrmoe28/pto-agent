"""
File download and processing for government documents
"""
import asyncio
import hashlib
import logging
import os
from pathlib import Path
from typing import Optional, Tuple
import httpx
import aiofiles
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class DownloadManager:
    """Manage downloading and processing of government documents"""
    
    def __init__(self, downloads_dir: str, max_download_mb: int = 25):
        self.downloads_dir = Path(downloads_dir)
        self.max_download_mb = max_download_mb
        self.max_download_bytes = max_download_mb * 1024 * 1024
        
        # Create downloads directory
        self.downloads_dir.mkdir(parents=True, exist_ok=True)
    
    async def download_file(self, http_client, url: str, jurisdiction_name: Optional[str] = None) -> Tuple[Optional[str], Optional[int], Optional[str], Optional[str]]:
        """
        Download a file and return (file_path, bytes, content_hash, filetype)
        """
        try:
            # Parse URL to get filename
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)
            
            if not filename or '.' not in filename:
                # Generate filename from URL
                filename = f"document_{hash(url) % 10000}"
            
            # Create jurisdiction subdirectory
            if jurisdiction_name:
                safe_name = self._sanitize_filename(jurisdiction_name)
                jurisdiction_dir = self.downloads_dir / safe_name
                jurisdiction_dir.mkdir(exist_ok=True)
            else:
                jurisdiction_dir = self.downloads_dir
            
            file_path = jurisdiction_dir / filename
            
            # Check if file already exists
            if file_path.exists():
                logger.debug(f"File already exists: {file_path}")
                file_size = file_path.stat().st_size
                content_hash = await self._calculate_file_hash(file_path)
                filetype = self._get_file_type_from_path(file_path)
                return str(file_path), file_size, content_hash, filetype
            
            # Download file
            response = await http_client.fetch(url)
            if not response:
                logger.warning(f"Failed to fetch {url}")
                return None, None, None, None
            
            # Check content length
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > self.max_download_bytes:
                logger.warning(f"File too large: {url} ({content_length} bytes)")
                return None, None, None, None
            
            # Download in chunks
            file_size = 0
            hasher = hashlib.sha256()
            
            async with aiofiles.open(file_path, 'wb') as f:
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    if file_size + len(chunk) > self.max_download_bytes:
                        logger.warning(f"File too large during download: {url}")
                        # Clean up partial file
                        if file_path.exists():
                            file_path.unlink()
                        return None, None, None, None
                    
                    await f.write(chunk)
                    hasher.update(chunk)
                    file_size += len(chunk)
            
            content_hash = hasher.hexdigest()
            filetype = self._get_file_type_from_path(file_path)
            
            logger.info(f"Downloaded {url} -> {file_path} ({file_size} bytes)")
            return str(file_path), file_size, content_hash, filetype
            
        except Exception as e:
            logger.error(f"Error downloading {url}: {e}")
            return None, None, None, None
    
    async def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of a file"""
        try:
            hasher = hashlib.sha256()
            async with aiofiles.open(file_path, 'rb') as f:
                while chunk := await f.read(8192):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            logger.warning(f"Error calculating hash for {file_path}: {e}")
            return ""
    
    def _get_file_type_from_path(self, file_path: Path) -> Optional[str]:
        """Get file type from file path"""
        suffix = file_path.suffix.lower()
        if suffix:
            return suffix[1:]  # Remove the dot
        return None
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for filesystem"""
        # Remove or replace invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # Limit length
        if len(filename) > 100:
            filename = filename[:100]
        
        return filename.strip()
    
    async def extract_pdf_text(self, file_path: str) -> Optional[str]:
        """Extract text from PDF file"""
        try:
            import pdfplumber
            
            text_content = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_content.append(text)
            
            return '\n'.join(text_content) if text_content else None
            
        except ImportError:
            logger.warning("pdfplumber not available for PDF text extraction")
            return None
        except Exception as e:
            logger.warning(f"Error extracting PDF text from {file_path}: {e}")
            return None
    
    async def process_downloaded_file(self, file_path: str, filetype: str) -> Optional[str]:
        """Process downloaded file and extract text content"""
        try:
            if filetype == 'pdf':
                return await self.extract_pdf_text(file_path)
            elif filetype in ['doc', 'docx']:
                # TODO: Add DOC/DOCX text extraction
                logger.debug(f"DOC/DOCX text extraction not implemented for {file_path}")
                return None
            elif filetype in ['xls', 'xlsx']:
                # TODO: Add Excel text extraction
                logger.debug(f"Excel text extraction not implemented for {file_path}")
                return None
            else:
                # Try to read as text
                try:
                    async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                        return await f.read()
                except UnicodeDecodeError:
                    logger.debug(f"Could not read {file_path} as text")
                    return None
                    
        except Exception as e:
            logger.warning(f"Error processing file {file_path}: {e}")
            return None
