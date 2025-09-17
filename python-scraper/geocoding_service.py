"""
Geocoding service for permit office addresses
"""
import asyncio
import httpx
from typing import Optional, Dict, Any
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import googlemaps
from models import GeocodingResult
from config import config
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for geocoding addresses to coordinates"""
    
    def __init__(self):
        self.google_client = None
        self.nominatim = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize geocoding clients"""
        try:
            if config.GOOGLE_MAPS_API_KEY:
                self.google_client = googlemaps.Client(key=config.GOOGLE_MAPS_API_KEY)
                logger.info("Google Maps client initialized")
            
            self.nominatim = Nominatim(user_agent="permit-office-scraper/1.0")
            logger.info("Nominatim client initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize geocoding clients: {e}")
    
    async def geocode_address(self, address: str) -> Optional[GeocodingResult]:
        """Geocode an address using multiple services"""
        
        # Try Google Maps first (most accurate)
        if self.google_client:
            result = await self._geocode_google(address)
            if result:
                return result
        
        # Fallback to OpenStreetMap/Nominatim
        result = await self._geocode_nominatim(address)
        if result:
            return result
        
        logger.warning(f"Failed to geocode address: {address}")
        return None
    
    async def _geocode_google(self, address: str) -> Optional[GeocodingResult]:
        """Geocode using Google Maps API"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            geocode_result = await loop.run_in_executor(
                None, 
                self.google_client.geocode, 
                address
            )
            
            if geocode_result:
                result = geocode_result[0]
                location = result['geometry']['location']
                address_components = result.get('address_components', [])
                
                # Extract address components
                city = self._extract_component(address_components, 'locality')
                county = self._extract_component(address_components, 'administrative_area_level_2')
                state = self._extract_component(address_components, 'administrative_area_level_1')
                zip_code = self._extract_component(address_components, 'postal_code')
                
                return GeocodingResult(
                    address=address,
                    latitude=location['lat'],
                    longitude=location['lng'],
                    formatted_address=result['formatted_address'],
                    city=city,
                    county=county.replace(' County', '') if county else None,
                    state=state,
                    zip_code=zip_code,
                    confidence=0.9,  # Google is generally very accurate
                    source="google"
                )
                
        except Exception as e:
            logger.error(f"Google geocoding failed for {address}: {e}")
        
        return None
    
    async def _geocode_nominatim(self, address: str) -> Optional[GeocodingResult]:
        """Geocode using OpenStreetMap/Nominatim"""
        try:
            loop = asyncio.get_event_loop()
            location = await loop.run_in_executor(
                None,
                self.nominatim.geocode,
                address,
                timeout=10
            )
            
            if location:
                # Parse the display name to extract components
                display_name = location.raw.get('display_name', '')
                components = self._parse_display_name(display_name)
                
                return GeocodingResult(
                    address=address,
                    latitude=location.latitude,
                    longitude=location.longitude,
                    formatted_address=display_name,
                    city=components.get('city'),
                    county=components.get('county'),
                    state=components.get('state'),
                    zip_code=components.get('zip_code'),
                    confidence=0.7,  # Nominatim is less accurate than Google
                    source="openstreetmap"
                )
                
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Nominatim geocoding failed for {address}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in Nominatim geocoding for {address}: {e}")
        
        return None
    
    def _extract_component(self, components: list, component_type: str) -> Optional[str]:
        """Extract address component by type"""
        for component in components:
            if component_type in component.get('types', []):
                return component['long_name']
        return None
    
    def _parse_display_name(self, display_name: str) -> Dict[str, Optional[str]]:
        """Parse OpenStreetMap display name to extract components"""
        parts = display_name.split(', ')
        
        # Simple parsing logic - can be improved
        city = None
        county = None
        state = None
        zip_code = None
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            # Check for state (2-letter code)
            if len(part) == 2 and part.isupper():
                state = part
            # Check for county
            elif 'County' in part:
                county = part.replace(' County', '')
            # Check for ZIP code
            elif part.isdigit() and len(part) == 5:
                zip_code = part
            # Assume first non-empty part is city
            elif not city and not any(x in part for x in ['County', 'State', 'United States']):
                city = part
        
        return {
            'city': city,
            'county': county,
            'state': state,
            'zip_code': zip_code
        }
    
    async def batch_geocode(self, addresses: list) -> Dict[str, GeocodingResult]:
        """Geocode multiple addresses in batch"""
        results = {}
        
        # Process in batches to avoid rate limits
        batch_size = 10
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.geocode_address(addr) for addr in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for addr, result in zip(batch, batch_results):
                if isinstance(result, GeocodingResult):
                    results[addr] = result
                elif isinstance(result, Exception):
                    logger.error(f"Geocoding failed for {addr}: {result}")
            
            # Rate limiting delay
            await asyncio.sleep(1)
        
        return results
