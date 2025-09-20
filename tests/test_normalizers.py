"""
Test fee normalization and summarization functions.
"""
import pytest
from scraper.fees_normalizer import (
    extract_fee_amounts, extract_fee_types, analyze_fee_table,
    summarize_fee_table, summarize_fees, normalize_fee_text
)


class TestFeeExtraction:
    """Test fee amount and type extraction."""

    def test_extract_fee_amounts(self):
        """Test extraction of monetary amounts."""
        text = "Building permit costs $150.00 and plan review is $75. Additional fees may apply."
        amounts = extract_fee_amounts(text)

        assert "$150.00" in amounts
        assert "$75" in amounts
        assert len(amounts) >= 2  # May include duplicates from different regex patterns

    def test_extract_fee_amounts_various_formats(self):
        """Test different currency formats."""
        text = "Fees: $1,500.00, $75, 250 dollars, and $50.50 USD"
        amounts = extract_fee_amounts(text)

        assert "$1,500.00" in amounts
        assert "$75" in amounts
        assert "$50.50" in amounts
        assert "250 dollars" in amounts

    def test_extract_fee_types(self):
        """Test extraction of fee types."""
        text = "Building permit for single family residential new construction, plan review required."
        types = extract_fee_types(text)

        assert "building permit" in types
        assert "plan review" in types
        assert "single family" in types
        assert "residential" in types
        assert "new construction" in types


class TestFeeTableAnalysis:
    """Test fee table analysis functions."""

    def test_analyze_fee_table_basic(self):
        """Test basic fee table analysis."""
        table = [
            ["Permit Type", "Fee", "Processing Time"],
            ["Building Permit", "$150", "5 days"],
            ["Electrical Permit", "$75", "3 days"],
            ["Plumbing Permit", "$100", "4 days"]
        ]

        analysis = analyze_fee_table(table)

        assert analysis['rows'] == 4
        assert analysis['columns'] == 3
        assert "Fee" in analysis['headers']
        assert "$150" in analysis['sample_fees']
        assert "building permit" in analysis['fee_types']

    def test_analyze_fee_table_empty(self):
        """Test analysis of empty table."""
        analysis = analyze_fee_table([])
        assert analysis == {}

    def test_summarize_fee_table(self):
        """Test fee table summarization."""
        table = [
            ["Service", "Cost", "Notes"],
            ["Residential Building Permit", "$200", "New construction"],
            ["Commercial Building Permit", "$500", "Per 1000 sq ft"],
            ["Plan Review", "$150", "Required for all permits"]
        ]

        summary = summarize_fee_table(table)

        assert "4 rows" in summary
        assert "3 columns" in summary
        assert "$200" in summary or "$500" in summary
        assert "residential" in summary.lower()


class TestFeeSummarization:
    """Test comprehensive fee summarization."""

    def test_summarize_fees_with_tables(self):
        """Test fee summarization with tables."""
        tables = [
            [
                ["Permit Type", "Fee"],
                ["Building", "$150"],
                ["Electrical", "$75"]
            ],
            [
                ["Service", "Cost"],
                ["Plan Review", "$100"],
                ["Inspection", "$50"]
            ]
        ]

        text = "Additional fees may include impact fees of $1,000 for new construction."

        bullets = summarize_fees(tables, text)

        assert len(bullets) <= 12  # Should limit to 12 bullets
        assert any("$150" in bullet for bullet in bullets)
        assert any("$1,000" in bullet for bullet in bullets)

    def test_summarize_fees_text_only(self):
        """Test fee summarization with text only."""
        text = """
        Permit fees are as follows:
        Building permit: $200 for residential, $500 for commercial.
        Electrical permit: $85 per inspection.
        Plan review fee: $125 required for all permits.
        Impact fees: $2,500 for new construction in growth areas.
        """

        bullets = summarize_fees([], text)

        assert len(bullets) > 0
        assert len(bullets) <= 12
        assert any("$200" in bullet for bullet in bullets)


class TestFeeNormalization:
    """Test fee text normalization."""

    def test_normalize_fee_text(self):
        """Test fee text normalization."""
        text = "Plan   review  fee: $ 150  per   sq  ft"
        normalized = normalize_fee_text(text)

        assert normalized == "plan review fee: $150 per sq ft"  # Expect lowercased output

    def test_normalize_fee_text_standardization(self):
        """Test standardization of common terms."""
        text = "Commercial building permit per sq. ft."
        normalized = normalize_fee_text(text)

        assert "commercial" in normalized
        assert "sq ft" in normalized