"""
Dynamic HTML rendering using Playwright for JavaScript-heavy pages.
"""
import asyncio
from typing import Optional

try:
    from playwright.async_api import async_playwright, Browser, Page
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False


class DynamicRenderer:
    """Handles JavaScript rendering for dynamic pages."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None

    async def __aenter__(self):
        if not HAS_PLAYWRIGHT:
            raise ImportError("Playwright not available. Install with: pip install playwright")

        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',  # Faster loading
            ]
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def render_page(self, url: str, timeout: int = 15000) -> Optional[str]:
        """
        Render a page and return the HTML after JavaScript execution.

        Args:
            url: URL to render
            timeout: Timeout in milliseconds

        Returns:
            Rendered HTML or None if failed
        """
        if not self.browser:
            return None

        try:
            page = await self.browser.new_page()

            # Block unnecessary resources for faster loading
            await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())

            # Set a shorter timeout for faster processing
            page.set_default_timeout(timeout)

            # Navigate to page
            await page.goto(url, wait_until='networkidle', timeout=timeout)

            # Wait a bit for any async content to load
            await page.wait_for_timeout(2000)

            # Get the rendered HTML
            html = await page.content()
            await page.close()

            return html

        except Exception as e:
            return None


# Global renderer instance
_renderer = None


async def render_html(url: str, timeout: int = 15000) -> Optional[str]:
    """
    Render HTML for a JavaScript-heavy page.

    Args:
        url: URL to render
        timeout: Timeout in milliseconds

    Returns:
        Rendered HTML or None if failed
    """
    if not HAS_PLAYWRIGHT:
        return None

    try:
        async with DynamicRenderer() as renderer:
            return await renderer.render_page(url, timeout)
    except Exception:
        return None


def render_html_sync(url: str, timeout: int = 15000) -> Optional[str]:
    """
    Synchronous wrapper for render_html.

    Args:
        url: URL to render
        timeout: Timeout in milliseconds

    Returns:
        Rendered HTML or None if failed
    """
    if not HAS_PLAYWRIGHT:
        return None

    try:
        # Check if we're already in an event loop
        try:
            loop = asyncio.get_running_loop()
            # We're in an async context, need to run in a new thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, render_html(url, timeout))
                return future.result(timeout=timeout/1000 + 5)  # Add buffer to timeout
        except RuntimeError:
            # No event loop running, safe to use asyncio.run
            return asyncio.run(render_html(url, timeout))
    except Exception:
        return None


def is_playwright_available() -> bool:
    """Check if Playwright is available for use."""
    return HAS_PLAYWRIGHT


def get_playwright_status() -> dict:
    """Get status information about Playwright availability."""
    return {
        'available': HAS_PLAYWRIGHT,
        'browsers_installed': _check_browsers_installed() if HAS_PLAYWRIGHT else False
    }


def _check_browsers_installed() -> bool:
    """Check if Playwright browsers are installed."""
    if not HAS_PLAYWRIGHT:
        return False

    try:
        # Try to launch browser to check if it's installed
        async def check():
            try:
                playwright = await async_playwright().start()
                browser = await playwright.chromium.launch(headless=True)
                await browser.close()
                await playwright.stop()
                return True
            except Exception:
                return False

        return asyncio.run(check())
    except Exception:
        return False