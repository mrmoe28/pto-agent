"""
Command-line interface for government scraper
"""
import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import List, Optional
import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import Config
from .runner import crawl
from .models import GovRecord
from .persist import DataPersister

app = typer.Typer(help="Government website scraper for Planning & Building departments")
console = Console()

@app.command()
def gov_crawl(
    start_url: List[str] = typer.Option(..., "--start-url", help="Starting URLs to crawl"),
    max_pages: int = typer.Option(500, "--max-pages", help="Maximum pages to crawl"),
    max_depth: int = typer.Option(6, "--max-depth", help="Maximum crawl depth"),
    concurrency: int = typer.Option(8, "--concurrency", help="Number of concurrent requests"),
    out: str = typer.Option("./data", "--out", help="Output directory"),
    format: List[str] = typer.Option(["jsonl", "csv"], "--format", help="Output formats"),
    resume: bool = typer.Option(False, "--resume", help="Resume from previous crawl"),
    fresh: bool = typer.Option(False, "--fresh", help="Start fresh (clear state)"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose logging")
):
    """Crawl government websites for permit information"""
    
    # Setup logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create config
    config = Config(
        start_urls=start_url,
        max_pages=max_pages,
        max_depth=max_depth,
        concurrency=concurrency,
        out_dir=out,
        format=format
    )
    
    console.print(f"[bold blue]Starting government crawler[/bold blue]")
    console.print(f"Start URLs: {len(start_url)}")
    console.print(f"Max pages: {max_pages}")
    console.print(f"Max depth: {max_depth}")
    console.print(f"Concurrency: {concurrency}")
    console.print(f"Output: {out}")
    console.print(f"Formats: {', '.join(format)}")
    
    # Clear state if fresh start
    if fresh:
        console.print("[yellow]Clearing previous state...[/yellow]")
        # TODO: Implement state clearing
    
    # Run crawler
    async def run_crawler():
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Crawling government websites...", total=None)
            
            try:
                results = await crawl(start_url, config)
                progress.update(task, description="Crawling completed!")
                
                # Display results
                console.print("\n[bold green]Crawling Results:[/bold green]")
                table = Table(show_header=True, header_style="bold magenta")
                table.add_column("Metric", style="cyan")
                table.add_column("Value", style="green")
                
                table.add_row("Pages Processed", str(results['pages_processed']))
                table.add_row("Records Saved", str(results['records_saved']))
                table.add_row("Errors", str(results['errors']))
                table.add_row("Elapsed Time", f"{results['elapsed_time']:.2f} seconds")
                table.add_row("Pages/Second", f"{results['pages_per_second']:.2f}")
                
                console.print(table)
                
                if results['records_saved'] > 0:
                    console.print(f"\n[green]✓ Successfully saved {results['records_saved']} records to {out}[/green]")
                else:
                    console.print(f"\n[yellow]⚠ No records were saved. Check the logs for issues.[/yellow]")
                
            except Exception as e:
                progress.update(task, description="Crawling failed!")
                console.print(f"\n[red]Error: {e}[/red]")
                sys.exit(1)
    
    asyncio.run(run_crawler())

@app.command()
def gov_validate(
    file: str = typer.Argument(..., help="JSONL file to validate"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output")
):
    """Validate JSONL records against GovRecord schema"""
    
    console.print(f"[bold blue]Validating {file}[/bold blue]")
    
    valid_count = 0
    invalid_count = 0
    errors = []
    
    try:
        with open(file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    record = GovRecord(**data)
                    valid_count += 1
                    
                    if verbose:
                        console.print(f"[green]✓ Line {line_num}: Valid[/green]")
                        
                except Exception as e:
                    invalid_count += 1
                    error_msg = f"Line {line_num}: {e}"
                    errors.append(error_msg)
                    
                    if verbose:
                        console.print(f"[red]✗ {error_msg}[/red]")
        
        # Summary
        console.print(f"\n[bold]Validation Results:[/bold]")
        console.print(f"Valid records: {valid_count}")
        console.print(f"Invalid records: {invalid_count}")
        
        if errors and not verbose:
            console.print(f"\n[red]Errors:[/red]")
            for error in errors[:10]:  # Show first 10 errors
                console.print(f"  {error}")
            if len(errors) > 10:
                console.print(f"  ... and {len(errors) - 10} more errors")
        
    except FileNotFoundError:
        console.print(f"[red]Error: File not found: {file}[/red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)

@app.command()
def gov_dedupe(
    input_file: str = typer.Argument(..., help="Input JSONL file"),
    output_file: str = typer.Option(None, "--output", "-o", help="Output file (default: input_file_deduped.jsonl)"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output")
):
    """Remove duplicate records from JSONL file"""
    
    if output_file is None:
        input_path = Path(input_file)
        output_file = input_path.parent / f"{input_path.stem}_deduped{input_path.suffix}"
    
    console.print(f"[bold blue]Deduplicating {input_file}[/bold blue]")
    console.print(f"Output: {output_file}")
    
    seen_hashes = set()
    total_count = 0
    duplicate_count = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile, \
             open(output_file, 'w', encoding='utf-8') as outfile:
            
            for line_num, line in enumerate(infile, 1):
                line = line.strip()
                if not line:
                    continue
                
                total_count += 1
                
                try:
                    data = json.loads(line)
                    record = GovRecord(**data)
                    
                    # Create hash for deduplication
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
                    
                    hash_string = '|'.join(f"{k}:{v}" for k, v in hash_data.items() if v is not None)
                    record_hash = str(hash(hash_string))
                    
                    if record_hash in seen_hashes:
                        duplicate_count += 1
                        if verbose:
                            console.print(f"[yellow]Duplicate at line {line_num}: {record.source_url}[/yellow]")
                    else:
                        seen_hashes.add(record_hash)
                        outfile.write(line + '\n')
                        
                except Exception as e:
                    console.print(f"[red]Error processing line {line_num}: {e}[/red]")
        
        # Summary
        unique_count = total_count - duplicate_count
        console.print(f"\n[bold]Deduplication Results:[/bold]")
        console.print(f"Total records: {total_count}")
        console.print(f"Unique records: {unique_count}")
        console.print(f"Duplicates removed: {duplicate_count}")
        
    except FileNotFoundError:
        console.print(f"[red]Error: File not found: {input_file}[/red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)

@app.command()
def gov_test(
    start_url: str = typer.Argument(..., help="URL to test"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output")
):
    """Test extraction on a single URL"""
    
    # Setup logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level)
    
    console.print(f"[bold blue]Testing extraction on: {start_url}[/bold blue]")
    
    async def test_extraction():
        from .http_client import HTTPClient
        from .extractors import GovernmentExtractor
        from bs4 import BeautifulSoup
        
        config = Config()
        extractor = GovernmentExtractor()
        
        async with HTTPClient(config) as http_client:
            try:
                # Fetch page
                response = await http_client.fetch(start_url)
                if not response:
                    console.print(f"[red]Failed to fetch: {start_url}[/red]")
                    return
                
                # Parse and extract
                soup = BeautifulSoup(response.text, 'lxml')
                record = extractor.extract_record(soup, start_url)
                
                # Display results
                console.print(f"\n[bold green]Extraction Results:[/bold green]")
                
                if record.jurisdiction_name:
                    console.print(f"Jurisdiction: {record.jurisdiction_name}")
                if record.permit_fee:
                    console.print(f"Permit Fee: {record.permit_fee}")
                if record.processing_instructions:
                    console.print(f"Instructions: {record.processing_instructions[:200]}...")
                if record.turnaround_time:
                    console.print(f"Turnaround: {record.turnaround_time}")
                if record.phone:
                    console.print(f"Phone: {record.phone}")
                if record.email:
                    console.print(f"Email: {record.email}")
                if record.address:
                    console.print(f"Address: {record.address}")
                if record.downloadable_applications:
                    console.print(f"Downloads: {len(record.downloadable_applications)} files")
                
                if not record.has_valuable_data():
                    console.print(f"\n[yellow]⚠ No valuable data found on this page[/yellow]")
                else:
                    console.print(f"\n[green]✓ Successfully extracted data[/green]")
                
            except Exception as e:
                console.print(f"[red]Error: {e}[/red]")
    
    asyncio.run(test_extraction())

if __name__ == "__main__":
    app()
