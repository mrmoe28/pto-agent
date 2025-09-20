"""
Test platform detection and parsing rules.
"""
import pytest
from bs4 import BeautifulSoup

from scraper.rules.platforms import accela, etrakit, tyler_energov, cityview, opengov, civicplus, salesforce_exp
from scraper.models import Record


class TestAccelaPlatform:
    """Test Accela platform detection and parsing."""

    def test_accela_detection(self):
        """Test Accela platform detection."""
        # Positive cases
        assert accela.detect("https://aca.somecounty.gov/CitizenAccess/", "<html>Test</html>")
        assert accela.detect("https://example.com/", "<html><meta name='generator' content='Accela'>Test</html>")
        assert accela.detect("https://example.com/", "<html>Accela Citizen Access</html>")

        # Negative cases
        assert not accela.detect("https://example.com/", "<html>Regular website</html>")

    def test_accela_parsing(self):
        """Test Accela platform parsing."""
        url = "https://aca.testcounty.gov/CitizenAccess/"
        html = """
        <html>
        <head><title>Accela Citizen Access</title></head>
        <body>
            <h1>Building Department - Test County</h1>
            <div class="permits">
                <a href="/permits/building">Building Permits</a>
                <a href="/permits/electrical">Electrical Permits</a>
            </div>
            <div class="fees">
                <p>Permit fee: $150 for residential</p>
                <p>Plan review fee: $75</p>
            </div>
            <div class="contact">
                <p>Phone: (555) 123-4567</p>
                <p>Email: permits@testcounty.gov</p>
                <p>Address: 123 Main St, Test City, GA 30301</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, 'html.parser')
        record = accela.parse(url, html, soup)

        assert record is not None
        assert record.platform == "accela"
        assert record.confidence > 0.1
        assert "Building Department" in record.department_name
        assert record.phone == "(555) 123-4567"
        assert record.email == "permits@testcounty.gov"
        assert record.permit_fee is not None


class TestEtrakitPlatform:
    """Test eTRAKiT platform detection and parsing."""

    def test_etrakit_detection(self):
        """Test eTRAKiT platform detection."""
        assert etrakit.detect("https://example.com/etrakit/", "<html>Test</html>")
        assert etrakit.detect("https://example.com/", "<html>eTRAKiT system</html>")

        assert not etrakit.detect("https://example.com/", "<html>Regular website</html>")

    def test_etrakit_parsing(self):
        """Test eTRAKiT platform parsing."""
        url = "https://permits.testcity.gov/etrakit/"
        html = """
        <html>
        <head><title>Building Safety & Accessibility</title></head>
        <body>
            <h1>Test City Building Department</h1>
            <div class="permit-section">
                <h3>Building Permits</h3>
                <p>Submit applications for new construction</p>
            </div>
            <table class="fee-table">
                <tr><th>Permit Type</th><th>Fee</th></tr>
                <tr><td>Single Family</td><td>$200</td></tr>
                <tr><td>Commercial</td><td>$500</td></tr>
            </table>
            <div class="contact-info">
                <p>Office Hours: Mon-Fri 8:00 AM - 5:00 PM</p>
                <p>Phone: (555) 987-6543</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, 'html.parser')
        record = etrakit.parse(url, html, soup)

        assert record is not None
        assert record.platform == "etrakit"
        assert record.confidence > 0.1
        assert "Test City" in record.department_name
        assert record.hours is not None
        assert "$200" in record.permit_fee or "$500" in record.permit_fee


class TestTylerEnergovPlatform:
    """Test Tyler EnerGov platform detection and parsing."""

    def test_tyler_energov_detection(self):
        """Test Tyler EnerGov platform detection."""
        assert tyler_energov.detect("https://permits.city.gov/energov/", "<html>Test</html>")
        assert tyler_energov.detect("https://example.com/", "<html>Tyler EnerGov</html>")

        assert not tyler_energov.detect("https://example.com/", "<html>Regular website</html>")

    def test_tyler_energov_parsing(self):
        """Test Tyler EnerGov platform parsing."""
        url = "https://permits.testcity.gov/energov/"
        html = """
        <html>
        <head><title>EnerGov Portal</title></head>
        <body>
            <h1>Development Services Department</h1>
            <div class="services">
                <li>Building Permits</li>
                <li>Plan Review</li>
                <li>Inspections</li>
            </div>
            <a href="/fees/schedule.pdf">View Fee Schedule</a>
            <div class="processing">
                <p>Plan review processing time: 10 business days</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, 'html.parser')
        record = tyler_energov.parse(url, html, soup)

        assert record is not None
        assert record.platform == "tyler-energov"
        assert record.confidence > 0.1
        assert "Development Services" in record.department_name
        assert record.turnaround_time is not None
        assert "10 business days" in record.turnaround_time


class TestOpenggovPlatform:
    """Test OpenGov platform detection and parsing."""

    def test_opengov_detection(self):
        """Test OpenGov platform detection."""
        assert opengov.detect("https://forms.opengov.com/testcity/", "<html>Test</html>")
        assert opengov.detect("https://example.com/", "<html>OpenGov forms</html>")

        assert not opengov.detect("https://example.com/", "<html>Regular website</html>")

    def test_opengov_parsing(self):
        """Test OpenGov platform parsing."""
        url = "https://forms.opengov.com/testcity/permits"
        html = """
        <html>
        <head><title>Test City Permits</title></head>
        <body>
            <div class="organization-name">Test City Planning Department</div>
            <div class="form-item">
                <h3>Building Permit Application</h3>
                <span class="fee">$125.00</span>
            </div>
            <div class="form-item">
                <h3>Electrical Permit</h3>
                <span class="fee">$85.00</span>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, 'html.parser')
        record = opengov.parse(url, html, soup)

        assert record is not None
        assert record.platform == "opengov"
        assert record.confidence > 0.1
        assert "Planning Department" in record.department_name
        assert "$125.00" in record.permit_fee or "$85.00" in record.permit_fee


class TestCivicplusPlatform:
    """Test CivicPlus platform detection and parsing."""

    def test_civicplus_detection(self):
        """Test CivicPlus platform detection."""
        assert civicplus.detect("https://testcity.gov/DocumentCenter/View/123", "<html>Test</html>")
        assert civicplus.detect("https://example.com/", "<html>CMS by CivicPlus</html>")

        assert not civicplus.detect("https://example.com/", "<html>Regular website</html>")

    def test_civicplus_parsing(self):
        """Test CivicPlus platform parsing."""
        url = "https://testcity.gov/departments/building"
        html = """
        <html>
        <head><title>Building Department - CivicPlus</title></head>
        <body>
            <h1>Building & Development Department</h1>
            <div class="content">
                <p>Submit building permit applications</p>
                <a href="/DocumentCenter/View/456/permit-application.pdf">Permit Application Form</a>
                <a href="/DocumentCenter/View/789/fee-schedule.pdf">Fee Schedule</a>
            </div>
            <div class="contact">
                <p>Business Hours: 8:00 AM - 4:30 PM</p>
                <p>Address: 456 City Hall Way, Test City, TX 75001</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, 'html.parser')
        record = civicplus.parse(url, html, soup)

        assert record is not None
        assert record.platform == "civicplus"
        assert record.confidence > 0.1
        assert "Building" in record.department_name
        assert len(record.downloadable_applications) > 0
        assert record.hours is not None


class TestSalesforceExpPlatform:
    """Test Salesforce Experience Cloud platform detection and parsing."""

    def test_salesforce_exp_detection(self):
        """Test Salesforce Experience Cloud platform detection."""
        assert salesforce_exp.detect("https://testcity.force.com/public/permits", "<html>Test</html>")
        assert salesforce_exp.detect("https://example.com/", "<html>lightning-container</html>")

        assert not salesforce_exp.detect("https://example.com/", "<html>Regular website</html>")

    def test_salesforce_exp_parsing(self):
        """Test Salesforce Experience Cloud platform parsing."""
        url = "https://testcity.force.com/public/permits"
        html = """
        <html>
        <head><title>Test City Permits Portal</title></head>
        <body>
            <div class="slds-page-header__title">Test City Development Services</div>
            <div class="lightning-card">
                <h3>Building Permits</h3>
                <p>Fee: Starting at $175</p>
            </div>
            <div class="lightning-card">
                <h3>Electrical Permits</h3>
                <p>Processing time: 3-5 business days</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, 'html.parser')
        record = salesforce_exp.parse(url, html, soup)

        assert record is not None
        assert record.platform == "salesforce-exp"
        assert record.confidence > 0.1
        assert "Development Services" in record.department_name
        assert record.permit_fee is not None or record.turnaround_time is not None