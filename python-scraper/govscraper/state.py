"""
SQLite-based state management for resume-safe crawling
"""
import aiosqlite
import asyncio
import logging
from typing import List, Tuple, Optional, Set
from urllib.parse import urlparse
import hashlib
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class StateManager:
    """SQLite-based state management for crawling"""
    
    def __init__(self, sqlite_path: str):
        self.sqlite_path = sqlite_path
        self.db = None
    
    async def __aenter__(self):
        await self.init_db()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.db:
            await self.db.close()
    
    async def init_db(self):
        """Initialize database tables"""
        self.db = await aiosqlite.connect(self.sqlite_path)
        
        # Create tables
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS visited (
                url TEXT PRIMARY KEY,
                status TEXT,
                ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS frontier (
                url TEXT PRIMARY KEY,
                depth INTEGER,
                ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS fingerprints (
                hash TEXT PRIMARY KEY,
                url TEXT,
                ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT,
                ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes
        await self.db.execute('CREATE INDEX IF NOT EXISTS idx_frontier_depth ON frontier(depth)')
        await self.db.execute('CREATE INDEX IF NOT EXISTS idx_visited_ts ON visited(ts)')
        
        await self.db.commit()
    
    async def is_visited(self, url: str) -> bool:
        """Check if URL has been visited"""
        cursor = await self.db.execute(
            'SELECT 1 FROM visited WHERE url = ?', (url,)
        )
        return await cursor.fetchone() is not None
    
    async def mark_visited(self, url: str, status: str = 'success'):
        """Mark URL as visited"""
        await self.db.execute(
            'INSERT OR REPLACE INTO visited (url, status) VALUES (?, ?)',
            (url, status)
        )
        await self.db.commit()
    
    async def push_urls(self, urls: List[str], depth: int):
        """Add URLs to frontier"""
        if not urls:
            return
        
        # Filter out already visited URLs
        visited_urls = set()
        for url in urls:
            if not await self.is_visited(url):
                visited_urls.add(url)
        
        if not visited_urls:
            return
        
        # Insert new URLs
        data = [(url, depth) for url in visited_urls]
        await self.db.executemany(
            'INSERT OR IGNORE INTO frontier (url, depth) VALUES (?, ?)',
            data
        )
        await self.db.commit()
        
        logger.debug(f"Added {len(visited_urls)} URLs to frontier at depth {depth}")
    
    async def pop_batch(self, n: int) -> List[Tuple[str, int]]:
        """Pop batch of URLs from frontier"""
        cursor = await self.db.execute(
            'SELECT url, depth FROM frontier ORDER BY depth, ts LIMIT ?',
            (n,)
        )
        rows = await cursor.fetchall()
        
        if not rows:
            return []
        
        # Remove from frontier
        urls = [row[0] for row in rows]
        placeholders = ','.join(['?' for _ in urls])
        await self.db.execute(
            f'DELETE FROM frontier WHERE url IN ({placeholders})',
            urls
        )
        await self.db.commit()
        
        return rows
    
    async def frontier_size(self) -> int:
        """Get frontier size"""
        cursor = await self.db.execute('SELECT COUNT(*) FROM frontier')
        result = await cursor.fetchone()
        return result[0] if result else 0
    
    async def visited_count(self) -> int:
        """Get visited count"""
        cursor = await self.db.execute('SELECT COUNT(*) FROM visited')
        result = await cursor.fetchone()
        return result[0] if result else 0
    
    async def add_fingerprint(self, content_hash: str, url: str):
        """Add content fingerprint to avoid duplicates"""
        await self.db.execute(
            'INSERT OR IGNORE INTO fingerprints (hash, url) VALUES (?, ?)',
            (content_hash, url)
        )
        await self.db.commit()
    
    async def has_fingerprint(self, content_hash: str) -> bool:
        """Check if content fingerprint exists"""
        cursor = await self.db.execute(
            'SELECT 1 FROM fingerprints WHERE hash = ?',
            (content_hash,)
        )
        return await cursor.fetchone() is not None
    
    async def save_meta(self, key: str, value: str):
        """Save metadata"""
        await self.db.execute(
            'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
            (key, value)
        )
        await self.db.commit()
    
    async def load_meta(self, key: str) -> Optional[str]:
        """Load metadata"""
        cursor = await self.db.execute(
            'SELECT value FROM meta WHERE key = ?',
            (key,)
        )
        result = await cursor.fetchone()
        return result[0] if result else None
    
    async def get_stats(self) -> dict:
        """Get crawling statistics"""
        cursor = await self.db.execute('SELECT COUNT(*) FROM visited')
        visited = (await cursor.fetchone())[0]
        
        cursor = await self.db.execute('SELECT COUNT(*) FROM frontier')
        frontier = (await cursor.fetchone())[0]
        
        cursor = await self.db.execute('SELECT COUNT(*) FROM fingerprints')
        fingerprints = (await cursor.fetchone())[0]
        
        return {
            'visited': visited,
            'frontier': frontier,
            'fingerprints': fingerprints
        }
    
    async def clear_frontier(self):
        """Clear frontier (for fresh start)"""
        await self.db.execute('DELETE FROM frontier')
        await self.db.commit()
    
    async def clear_all(self):
        """Clear all data (for fresh start)"""
        await self.db.execute('DELETE FROM visited')
        await self.db.execute('DELETE FROM frontier')
        await self.db.execute('DELETE FROM fingerprints')
        await self.db.execute('DELETE FROM meta')
        await self.db.commit()
