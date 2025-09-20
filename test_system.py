#!/usr/bin/env python3
"""
Quick system validation test for the US50 Permit Scraper.
"""
import sys
from pathlib import Path

# Add scraper to path
sys.path.insert(0, str(Path(__file__).parent))

from scraper.models import Record, Download
from scraper.config import US_STATES, START_SEEDS, PLATFORM_PRIORITY
from scraper.utils import clean_text, find_contacts, normalize_url
from scraper.fees_normalizer import extract_fee_amounts, summarize_fees
from scraper.pdf_extract import get_available_extractors
from scraper.dynamic import is_playwright_available
from scraper.rules.platforms import accela, etrakit
from scraper.rules import generic

def test_basic_functionality():
    """Test basic functionality without network calls."""
    print("🧪 Testing basic functionality...")

    # Test models
    print("✅ Testing data models...")
    download = Download(title="Test Form", url="https://example.com/form.pdf")
    record = Record(
        source_url="https://example.com/permits",
        state="GA",
        department_name="Test Department",
        confidence=0.8
    )
    assert record.state == "GA"
    assert len(record.downloadable_applications) == 0
    print("   ✓ Models working correctly")

    # Test utils
    print("✅ Testing utilities...")
    text = "  Test   text  with   spaces  "
    cleaned = clean_text(text)
    assert cleaned == "Test text with spaces"

    contacts = find_contacts("Call (555) 123-4567 or email test@example.com")
    assert len(contacts['phones']) >= 1
    assert len(contacts['emails']) >= 1
    print("   ✓ Utilities working correctly")

    # Test fee extraction
    print("✅ Testing fee normalization...")
    amounts = extract_fee_amounts("Permit costs $150 and plan review is $75")
    assert len(amounts) >= 2

    tables = [[["Type", "Fee"], ["Building", "$200"], ["Electrical", "$100"]]]
    summary = summarize_fees(tables, "Additional fee: $50")
    assert len(summary) > 0
    print("   ✓ Fee normalization working correctly")

    # Test platform detection
    print("✅ Testing platform detection...")
    assert accela.detect("https://aca.city.gov/CitizenAccess/", "<html>Accela</html>")
    assert etrakit.detect("https://permits.city.gov/etrakit/", "<html>eTRAKiT</html>")
    print("   ✓ Platform detection working correctly")

    # Test configuration
    print("✅ Testing configuration...")
    assert len(US_STATES) == 50
    assert len(PLATFORM_PRIORITY) >= 7
    assert len(START_SEEDS) >= 3  # At least the Georgia seeds
    print("   ✓ Configuration loaded correctly")

def test_dependencies():
    """Test optional dependencies."""
    print("🔧 Testing dependencies...")

    # PDF extractors
    extractors = get_available_extractors()
    print(f"   📄 PDF extractors available: {', '.join(extractors) if extractors else 'None'}")

    # Playwright
    playwright_available = is_playwright_available()
    print(f"   🎭 Playwright available: {'Yes' if playwright_available else 'No'}")

    # Check seed files
    seed_files = [
        "data/seeds/us/states.json",
        "data/seeds/us/start_urls.txt",
        "data/seeds/us/platforms.json"
    ]

    for seed_file in seed_files:
        exists = Path(seed_file).exists()
        print(f"   📁 {seed_file}: {'✓' if exists else '✗'}")

def test_exports():
    """Test export functionality."""
    print("📊 Testing export functionality...")

    # Create sample records
    records = [
        Record(
            source_url="https://example1.com/permits",
            state="GA",
            county="Fulton",
            city="Atlanta",
            department_name="Building Department",
            platform="accela",
            permit_fee="$150 for residential permits",
            confidence=0.8
        ),
        Record(
            source_url="https://example2.com/permits",
            state="CA",
            county="Los Angeles",
            department_name="Planning Department",
            platform="tyler-energov",
            permit_fee="$200 base fee",
            confidence=0.7
        )
    ]

    from scraper.export import calculate_coverage_metrics, merge_duplicates

    # Test metrics calculation
    metrics = calculate_coverage_metrics(records)
    assert metrics['total_records'] == 2
    assert 'state' in metrics['field_coverage']
    print("   ✓ Coverage metrics calculation working")

    # Test duplicate merging (shouldn't merge these different records)
    merged = merge_duplicates(records)
    assert len(merged) == 2
    print("   ✓ Duplicate merging working")

def main():
    """Run all tests."""
    print("🚀 US50 Permit Scraper - System Validation")
    print("=" * 50)

    try:
        test_basic_functionality()
        test_dependencies()
        test_exports()

        print("\n🎉 All tests passed! System is ready to use.")
        print("\nNext steps:")
        print("1. Install optional dependencies: pip install pdfplumber camelot-py tabula-py")
        print("2. Add more seed URLs for additional states")
        print("3. Run: python -m cli crawl --urls data/seeds/us/start_urls.txt --depth 2")

        return 0

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())