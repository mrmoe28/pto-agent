#!/usr/bin/env python3
"""
Simple fee scraper to collect real permit fee data from government websites
This bypasses the complex scraper setup and directly scrapes key websites
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def scrape_atlanta_fees():
    """Scrape permit fees from Atlanta government website"""
    try:
        print("🔍 Scraping Atlanta permit fees...")
        
        # Atlanta building permit fees page
        url = "https://www.atlantaga.gov/government/departments/city-planning/bureau-of-buildings/permit-fees"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for fee information
        fees = {}
        
        # Common patterns for fee information
        fee_patterns = [
            r'\$(\d+(?:\.\d{2})?)',
            r'(\d+(?:\.\d{2})?)\s*dollars?',
            r'fee[:\s]*\$?(\d+(?:\.\d{2})?)',
            r'cost[:\s]*\$?(\d+(?:\.\d{2})?)',
            r'price[:\s]*\$?(\d+(?:\.\d{2})?)'
        ]
        
        # Look for building permit fees
        building_section = soup.find(text=re.compile(r'building.*permit', re.I))
        if building_section:
            parent = building_section.parent
            text = parent.get_text() if parent else ""
            for pattern in fee_patterns:
                matches = re.findall(pattern, text, re.I)
                if matches:
                    fees['building'] = {
                        'amount': float(matches[0]),
                        'description': 'Building permit fee (scraped from website)',
                        'unit': 'per application'
                    }
                    break
        
        # Look for electrical permit fees
        electrical_section = soup.find(text=re.compile(r'electrical.*permit', re.I))
        if electrical_section:
            parent = electrical_section.parent
            text = parent.get_text() if parent else ""
            for pattern in fee_patterns:
                matches = re.findall(pattern, text, re.I)
                if matches:
                    fees['electrical'] = {
                        'amount': float(matches[0]),
                        'description': 'Electrical permit fee (scraped from website)',
                        'unit': 'per permit'
                    }
                    break
        
        # Look for plumbing permit fees
        plumbing_section = soup.find(text=re.compile(r'plumbing.*permit', re.I))
        if plumbing_section:
            parent = plumbing_section.parent
            text = parent.get_text() if parent else ""
            for pattern in fee_patterns:
                matches = re.findall(pattern, text, re.I)
                if matches:
                    fees['plumbing'] = {
                        'amount': float(matches[0]),
                        'description': 'Plumbing permit fee (scraped from website)',
                        'unit': 'per fixture'
                    }
                    break
        
        print(f"✅ Found {len(fees)} fee types for Atlanta")
        return fees
        
    except Exception as e:
        print(f"❌ Error scraping Atlanta fees: {e}")
        return {}

def scrape_sandy_springs_fees():
    """Scrape permit fees from Sandy Springs government website"""
    try:
        print("🔍 Scraping Sandy Springs permit fees...")
        
        # Sandy Springs permit information page
        url = "https://www.sandyspringsga.gov/government/city-departments/community-development/permits"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        fees = {}
        
        # Look for fee tables or fee information
        fee_tables = soup.find_all('table')
        for table in fee_tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    text = ' '.join([cell.get_text().strip() for cell in cells])
                    
                    # Look for building permit fees
                    if re.search(r'building.*permit', text, re.I):
                        fee_match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
                        if fee_match:
                            fees['building'] = {
                                'amount': float(fee_match.group(1)),
                                'description': 'Building permit fee (scraped from website)',
                                'unit': 'per application'
                            }
                    
                    # Look for electrical permit fees
                    if re.search(r'electrical.*permit', text, re.I):
                        fee_match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
                        if fee_match:
                            fees['electrical'] = {
                                'amount': float(fee_match.group(1)),
                                'description': 'Electrical permit fee (scraped from website)',
                                'unit': 'per permit'
                            }
                    
                    # Look for plumbing permit fees
                    if re.search(r'plumbing.*permit', text, re.I):
                        fee_match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
                        if fee_match:
                            fees['plumbing'] = {
                                'amount': float(fee_match.group(1)),
                                'description': 'Plumbing permit fee (scraped from website)',
                                'unit': 'per fixture'
                            }
        
        print(f"✅ Found {len(fees)} fee types for Sandy Springs")
        return fees
        
    except Exception as e:
        print(f"❌ Error scraping Sandy Springs fees: {e}")
        return {}

def scrape_savannah_fees():
    """Scrape permit fees from Savannah government website"""
    try:
        print("🔍 Scraping Savannah permit fees...")
        
        # Savannah development services fees page
        url = "https://www.savannahga.gov/1072/Development-Services"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        fees = {}
        
        # Look for fee information in the page content
        page_text = soup.get_text()
        
        # Common fee patterns
        fee_patterns = [
            r'building.*permit.*\$(\d+(?:\.\d{2})?)',
            r'electrical.*permit.*\$(\d+(?:\.\d{2})?)',
            r'plumbing.*permit.*\$(\d+(?:\.\d{2})?)',
            r'mechanical.*permit.*\$(\d+(?:\.\d{2})?)',
            r'zoning.*permit.*\$(\d+(?:\.\d{2})?)'
        ]
        
        for pattern in fee_patterns:
            matches = re.findall(pattern, page_text, re.I)
            if matches:
                permit_type = pattern.split('.*')[0]
                fees[permit_type] = {
                    'amount': float(matches[0]),
                    'description': f'{permit_type.title()} permit fee (scraped from website)',
                    'unit': 'per application'
                }
        
        print(f"✅ Found {len(fees)} fee types for Savannah")
        return fees
        
    except Exception as e:
        print(f"❌ Error scraping Savannah fees: {e}")
        return {}

def main():
    """Main function to scrape fees from multiple government websites"""
    print("🚀 Starting real government fee scraping...")
    
    all_fees = {}
    
    # Scrape fees from different cities
    atlanta_fees = scrape_atlanta_fees()
    if atlanta_fees:
        all_fees['Atlanta'] = atlanta_fees
    
    sandy_springs_fees = scrape_sandy_springs_fees()
    if sandy_springs_fees:
        all_fees['Sandy Springs'] = sandy_springs_fees
    
    savannah_fees = scrape_savannah_fees()
    if savannah_fees:
        all_fees['Savannah'] = savannah_fees
    
    # Save results to JSON file
    output_file = f"real_fee_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(all_fees, f, indent=2, default=str)
    
    print(f"\n🎉 Scraping complete!")
    print(f"📊 Collected fees for {len(all_fees)} cities")
    print(f"📁 Results saved to: {output_file}")
    
    # Print summary
    for city, fees in all_fees.items():
        print(f"\n{city}:")
        for permit_type, fee_info in fees.items():
            print(f"  {permit_type.title()}: ${fee_info['amount']} - {fee_info['description']}")
    
    return all_fees

if __name__ == "__main__":
    main()
