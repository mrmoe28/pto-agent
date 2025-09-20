#!/usr/bin/env python3
"""
US50 Permit Scraper CLI - Command line interface for the permit data scraper.
"""
import sys
import json
from pathlib import Path
from typing import List, Optional
import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint

# Add scraper module to path
sys.path.insert(0, str(Path(__file__).parent))

from scraper.crawl import PermitCrawler
from scraper.export import export_data
from scraper.config import START_SEEDS, US_STATES, PLATFORM_PRIORITY
from scraper.models import Record
from scraper.dynamic import is_playwright_available, get_playwright_status
from scraper.pdf_extract import get_available_extractors

app = typer.Typer(help="US50 Permit Scraper - Extract permit data across all 50 US states")
console = Console()


@app.command()
def crawl(
    urls: Optional[str] = typer.Option(
        None,
        "--urls",
        help="Path to file containing start URLs (default: data/seeds/us/start_urls.txt)"
    ),
    depth: int = typer.Option(3, "--depth", help="Maximum crawl depth"),
    out: str = typer.Option("data/exports", "--out", help="Output directory for exports"),
    allow_dynamic: bool = typer.Option(False, "--allow-dynamic", help="Enable JavaScript rendering"),
    state: str = typer.Option("ALL", "--state", help="Target specific state (e.g., GA, CA) or ALL"),
    platform: str = typer.Option("any", "--platform", help="Target specific platform or 'any'")
):
    """Crawl permit websites and extract data."""

    # Load URLs
    if urls:
        urls_file = Path(urls)
    else:
        urls_file = Path("data/seeds/us/start_urls.txt")

    if not urls_file.exists():
        console.print(f"[red]Error: URLs file not found: {urls_file}[/red]")
        raise typer.Exit(1)

    # Read URLs
    start_urls = []
    with open(urls_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Filter by state if specified
                if state != "ALL":
                    # Simple heuristic: check if URL contains state info
                    # This is basic - in production, you'd have better metadata
                    line_upper = line.upper()
                    if state.upper() in line_upper or f".{state.lower()}." in line:
                        start_urls.append(line)
                else:
                    start_urls.append(line)

    if not start_urls:
        console.print("[yellow]No URLs found to crawl[/yellow]")
        raise typer.Exit(1)

    console.print(f"[green]Starting crawl with {len(start_urls)} seed URLs[/green]")
    console.print(f"Max depth: {depth}, Dynamic rendering: {allow_dynamic}")

    if allow_dynamic and not is_playwright_available():
        console.print("[yellow]Warning: Playwright not available for dynamic rendering[/yellow]")

    # Initialize crawler
    crawler = PermitCrawler(max_depth=depth, allow_dynamic=allow_dynamic)

    records = []

    # Crawl with progress bar
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Crawling websites...", total=None)

        try:
            for record in crawler.crawl(start_urls):
                records.append(record)
                progress.update(task, description=f"Found {len(records)} records...")
        except KeyboardInterrupt:
            console.print("\n[yellow]Crawl interrupted by user[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Crawl error: {e}[/red]")
            raise typer.Exit(1)

    # Show results
    stats = crawler.get_stats()
    console.print("\n[bold]Crawl Results:[/bold]")
    console.print(f"Records found: {len(records)}")
    console.print(f"Pages fetched: {stats.pages_fetched}")
    console.print(f"Pages rendered: {stats.rendered_pages}")
    console.print(f"PDFs parsed: {stats.pdfs_parsed}")
    console.print(f"Robots blocked: {stats.robots_skipped}")

    # Show platform distribution
    if stats.platform_counts:
        table = Table(title="Platform Detection Results")
        table.add_column("Platform", style="cyan")
        table.add_column("Count", style="green")

        for platform, count in sorted(stats.platform_counts.items(), key=lambda x: x[1], reverse=True):
            table.add_row(platform, str(count))

        console.print(table)

    # Export data
    if records:
        output_dir = Path(out)
        result = export_data(records, output_dir)

        console.print(f"\n[green]Exported {result['exported_count']} records to:[/green]")
        console.print(f"CSV: {result['csv_path']}")
        console.print(f"JSON: {result['json_path']}")
        console.print(f"Report: {result['report_path']}")

        # Show field coverage
        metrics = result['metrics']
        coverage_table = Table(title="Field Coverage")
        coverage_table.add_column("Field", style="cyan")
        coverage_table.add_column("Coverage", style="green")

        field_coverage = metrics['field_coverage']
        for field, stats in sorted(field_coverage.items(), key=lambda x: x[1]['percentage'], reverse=True):
            coverage_table.add_row(field, f"{stats['percentage']}% ({stats['count']} records)")

        console.print(coverage_table)
    else:
        console.print("[yellow]No records found[/yellow]")
        raise typer.Exit(1)


@app.command()
def resume(
    ledger: str = typer.Argument(..., help="Path to crawl ledger JSON file to resume from")
):
    """Resume crawling from a saved ledger file."""
    ledger_path = Path(ledger)

    if not ledger_path.exists():
        console.print(f"[red]Error: Ledger file not found: {ledger_path}[/red]")
        raise typer.Exit(1)

    console.print("[yellow]Resume functionality not yet implemented[/yellow]")
    console.print("This would reload the crawl state and continue from where it left off")


@app.command()
def test_url(
    url: str = typer.Argument(..., help="URL to test parsing on"),
    allow_dynamic: bool = typer.Option(False, "--allow-dynamic", help="Enable JavaScript rendering")
):
    """Test URL parsing and show extracted record."""
    from scraper.utils import get, looks_js_heavy
    from scraper.dynamic import render_html_sync
    from bs4 import BeautifulSoup

    console.print(f"[blue]Testing URL: {url}[/blue]")

    try:
        # Fetch page
        response = get(url)
        html = response.text

        # Check if needs rendering
        if allow_dynamic and looks_js_heavy(html):
            console.print("[yellow]Page appears JS-heavy, attempting dynamic rendering...[/yellow]")
            rendered_html = render_html_sync(url)
            if rendered_html:
                html = rendered_html
                console.print("[green]Dynamic rendering successful[/green]")

        # Parse
        soup = BeautifulSoup(html, 'html.parser')
        crawler = PermitCrawler()
        record = crawler.parse_page(url, html, soup, 'test')

        if record:
            console.print("[green]✓ Record extracted successfully[/green]")

            # Display record as formatted JSON
            record_dict = record.model_dump()
            formatted_json = json.dumps(record_dict, indent=2, default=str)
            console.print("\n[bold]Extracted Record:[/bold]")
            console.print(formatted_json)
        else:
            console.print("[red]✗ No record could be extracted[/red]")
            raise typer.Exit(1)

    except Exception as e:
        console.print(f"[red]Error testing URL: {e}[/red]")
        raise typer.Exit(1)


@app.command()
def status():
    """Show scraper status and configuration."""
    console.print("[bold blue]US50 Permit Scraper Status[/bold blue]\n")

    # Basic info
    console.print(f"Available states: {len(US_STATES)}")
    console.print(f"Default seed URLs: {len(START_SEEDS)}")
    console.print(f"Platform detectors: {len(PLATFORM_PRIORITY)}")

    # Platform status table
    platform_table = Table(title="Platform Detection Modules")
    platform_table.add_column("Platform", style="cyan")
    platform_table.add_column("Status", style="green")

    for platform in PLATFORM_PRIORITY:
        platform_table.add_row(platform, "✓ Available")

    console.print(platform_table)

    # Dependencies status
    deps_table = Table(title="Dependencies Status")
    deps_table.add_column("Component", style="cyan")
    deps_table.add_column("Status", style="green")

    # Playwright status
    playwright_status = get_playwright_status()
    if playwright_status['available']:
        deps_table.add_row("Playwright (JS rendering)", "✓ Available")
    else:
        deps_table.add_row("Playwright (JS rendering)", "✗ Not installed")

    # PDF extractors
    pdf_extractors = get_available_extractors()
    if pdf_extractors:
        deps_table.add_row("PDF extraction", f"✓ {', '.join(pdf_extractors)}")
    else:
        deps_table.add_row("PDF extraction", "✗ No extractors available")

    console.print(deps_table)

    # Show seed file status
    seed_files = [
        ("States data", "data/seeds/us/states.json"),
        ("Start URLs", "data/seeds/us/start_urls.txt"),
        ("Platform hints", "data/seeds/us/platforms.json")
    ]

    seed_table = Table(title="Seed Files")
    seed_table.add_column("File", style="cyan")
    seed_table.add_column("Status", style="green")

    for name, path in seed_files:
        if Path(path).exists():
            seed_table.add_row(name, "✓ Found")
        else:
            seed_table.add_row(name, "✗ Missing")

    console.print(seed_table)


@app.command()
def install_deps():
    """Install optional dependencies for enhanced functionality."""
    console.print("[bold]Installing optional dependencies...[/bold]")

    import subprocess
    import sys

    # PDF processing libraries
    pdf_libs = [
        "pdfplumber", "camelot-py[cv]", "tabula-py", "pdfminer.six"
    ]

    # Other libraries
    other_libs = [
        "requests-cache", "tenacity", "python-dateutil",
        "rapidfuzz", "chardet", "tldextract"
    ]

    all_libs = pdf_libs + other_libs

    console.print(f"Installing {len(all_libs)} packages...")

    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install"
        ] + all_libs, check=True)

        console.print("[green]✓ Dependencies installed successfully[/green]")
        console.print("\nFor Playwright (JavaScript rendering), also run:")
        console.print("pip install playwright && python -m playwright install --with-deps")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]✗ Installation failed: {e}[/red]")
        raise typer.Exit(1)


if __name__ == "__main__":
    app()