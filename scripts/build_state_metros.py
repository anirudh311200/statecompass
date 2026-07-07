"""
Build data/state_metros.json — metro layer for State Focus Mode (Feature 1).

Wave A: top founder states with richer metro sets.
Wave B: remaining states (2–3 metros each; AK/HI included).
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DATA = ROOT / "data" / "state_metros.json"
OUT_PUBLIC = ROOT / "public" / "data" / "state_metros.json"

DISCLAIMER = (
    "Metro strengths are curated operational context — not CNBC rankings. "
    "StateCompass derived estimates where noted."
)

# (id, name, lat, lng, strengths[], industryTags[], sourceUrl, sourceLabel, derivedNote?)
# industryTags align with quiz: saas, fintech, ecommerce, marketplace, engineering, finance, healthcare, energy, logistics, vc, bootstrap

METROS: dict[str, list] = {
    "TX": [
        ("austin", "Austin", 30.27, -97.74,
         ["Tech talent hub", "Strong VC pipeline", "No state income tax"],
         ["saas", "engineering", "vc"], "https://www.texas.gov/", "State of Texas"),
        ("dallas", "Dallas–Fort Worth", 32.78, -96.80,
         ["Corporate HQ cluster", "Diverse talent pool", "Major airport hub"],
         ["finance", "marketplace", "logistics"], "https://www.texas.gov/", "State of Texas"),
        ("houston", "Houston", 29.76, -95.37,
         ["Energy & industrial base", "Port access", "Large metro economy"],
         ["energy", "healthcare", "logistics"], "https://www.texas.gov/", "State of Texas"),
        ("san-antonio", "San Antonio", 29.42, -98.49,
         ["Lower COL than coastal hubs", "Cybersecurity cluster", "Business-friendly"],
         ["bootstrap", "healthcare", "saas"], "https://www.texas.gov/", "State of Texas"),
    ],
    "CA": [
        ("sf-bay", "San Francisco Bay Area", 37.77, -122.42,
         ["Deep VC access", "Top engineering talent", "Global tech ecosystem"],
         ["saas", "engineering", "vc", "fintech"], "https://www.ca.gov/", "State of California"),
        ("los-angeles", "Los Angeles", 34.05, -118.24,
         ["Media & commerce hub", "Diverse industries", "Port & logistics"],
         ["ecommerce", "marketplace", "healthcare"], "https://www.ca.gov/", "State of California"),
        ("san-diego", "San Diego", 32.72, -117.16,
         ["Life sciences cluster", "Defense tech", "Quality of life"],
         ["healthcare", "engineering", "saas"], "https://www.ca.gov/", "State of California"),
        ("sacramento", "Sacramento", 38.58, -121.49,
         ["State capital proximity", "Lower COL vs Bay Area", "Growing tech scene"],
         ["bootstrap", "saas", "healthcare"], "https://www.ca.gov/", "State of California"),
    ],
    "NY": [
        ("nyc", "New York City", 40.71, -74.01,
         ["Finance & VC capital", "Global talent", "Enterprise customers"],
         ["finance", "fintech", "vc", "marketplace"], "https://www.ny.gov/", "State of New York"),
        ("albany", "Albany", 42.65, -73.76,
         ["Tech & nanotech corridor", "State government hub", "Lower COL"],
         ["engineering", "healthcare", "bootstrap"], "https://www.ny.gov/", "State of New York"),
        ("buffalo", "Buffalo", 42.89, -78.88,
         ["Affordable operations", "Renewable energy growth", "Cross-border logistics"],
         ["bootstrap", "healthcare", "logistics"], "https://www.ny.gov/", "State of New York"),
        ("rochester", "Rochester", 43.16, -77.61,
         ["Optics & imaging legacy", "University pipeline", "Manufacturing base"],
         ["engineering", "healthcare", "saas"], "https://www.ny.gov/", "State of New York"),
    ],
    "FL": [
        ("miami", "Miami", 25.76, -80.19,
         ["LatAm gateway", "Fintech growth", "No state income tax"],
         ["fintech", "marketplace", "vc"], "https://www.myflorida.com/", "State of Florida"),
        ("tampa", "Tampa Bay", 27.95, -82.46,
         ["Fast-growing tech hub", "Business-friendly", "Quality of life"],
         ["saas", "healthcare", "bootstrap"], "https://www.myflorida.com/", "State of Florida"),
        ("orlando", "Orlando", 28.54, -81.38,
         ["Simulation & defense tech", "Tourism-adjacent commerce", "Talent inflow"],
         ["engineering", "ecommerce", "healthcare"], "https://www.myflorida.com/", "State of Florida"),
        ("jacksonville", "Jacksonville", 30.33, -81.66,
         ["Logistics & fintech", "Lower COL", "Port access"],
         ["logistics", "fintech", "bootstrap"], "https://www.myflorida.com/", "State of Florida"),
    ],
    "WA": [
        ("seattle", "Seattle", 47.61, -122.33,
         ["Cloud & enterprise SaaS", "Deep engineering talent", "VC access"],
         ["saas", "engineering", "vc"], "https://www.wa.gov/", "State of Washington"),
        ("tacoma", "Tacoma", 47.25, -122.44,
         ["Port of Tacoma", "Lower COL vs Seattle", "Manufacturing"],
         ["logistics", "bootstrap", "healthcare"], "https://www.wa.gov/", "State of Washington"),
        ("spokane", "Spokane", 47.66, -117.43,
         ["Affordable inland hub", "University talent", "Growing remote workforce"],
         ["bootstrap", "healthcare", "saas"], "https://www.wa.gov/", "State of Washington"),
    ],
    "NC": [
        ("raleigh-durham", "Raleigh–Durham", 35.78, -78.64,
         ["Research Triangle talent", "Life sciences & SaaS", "Strong universities"],
         ["saas", "engineering", "healthcare"], "https://www.nc.gov/", "State of North Carolina"),
        ("charlotte", "Charlotte", 35.23, -80.84,
         ["Finance & fintech hub", "Banking headquarters", "Fast growth"],
         ["finance", "fintech", "marketplace"], "https://www.nc.gov/", "State of North Carolina"),
        ("greensboro", "Greensboro", 36.07, -79.79,
         ["Manufacturing & logistics", "Lower COL", "Central location"],
         ["logistics", "bootstrap", "healthcare"], "https://www.nc.gov/", "State of North Carolina"),
    ],
    "CO": [
        ("denver", "Denver", 39.74, -104.99,
         ["VC & startup density", "Outdoor lifestyle talent magnet", "Central time zone"],
         ["saas", "vc", "engineering"], "https://www.colorado.gov/", "State of Colorado"),
        ("boulder", "Boulder", 40.02, -105.27,
         ["Deep tech & research", "University spinouts", "Premium talent"],
         ["engineering", "saas", "vc"], "https://www.colorado.gov/", "State of Colorado"),
        ("colorado-springs", "Colorado Springs", 38.83, -104.82,
         ["Defense & aerospace", "Lower COL", "Growing tech"],
         ["engineering", "healthcare", "bootstrap"], "https://www.colorado.gov/", "State of Colorado"),
    ],
    "GA": [
        ("atlanta", "Atlanta", 33.75, -84.39,
         ["Fortune 500 density", "Diverse talent", "Major airport hub"],
         ["fintech", "saas", "logistics", "marketplace"], "https://georgia.gov/", "State of Georgia"),
        ("savannah", "Savannah", 32.08, -81.09,
         ["Port of Savannah", "Film & creative", "Coastal logistics"],
         ["logistics", "ecommerce", "bootstrap"], "https://georgia.gov/", "State of Georgia"),
        ("augusta", "Augusta", 33.47, -82.01,
         ["Cyber & healthcare", "Lower COL", "Military-adjacent tech"],
         ["healthcare", "engineering", "bootstrap"], "https://georgia.gov/", "State of Georgia"),
    ],
    "MA": [
        ("boston", "Boston", 42.36, -71.06,
         ["Biotech & enterprise SaaS", "Top universities", "Deep VC"],
         ["saas", "healthcare", "vc", "engineering"], "https://www.mass.gov/", "Commonwealth of Massachusetts"),
        ("cambridge", "Cambridge", 42.37, -71.11,
         ["AI & research spinouts", "MIT/Harvard pipeline", "Hard tech"],
         ["engineering", "saas", "vc"], "https://www.mass.gov/", "Commonwealth of Massachusetts"),
        ("worcester", "Worcester", 42.26, -71.80,
         ["Affordable vs Boston", "Healthcare cluster", "Manufacturing"],
         ["healthcare", "bootstrap", "engineering"], "https://www.mass.gov/", "Commonwealth of Massachusetts"),
    ],
    "TN": [
        ("nashville", "Nashville", 36.16, -86.78,
         ["Healthcare HQ cluster", "No state income tax", "Fast in-migration"],
         ["healthcare", "saas", "bootstrap"], "https://www.tn.gov/", "State of Tennessee"),
        ("memphis", "Memphis", 35.15, -90.05,
         ["Logistics crossroads", "Distribution hub", "Lower COL"],
         ["logistics", "ecommerce", "healthcare"], "https://www.tn.gov/", "State of Tennessee"),
        ("chattanooga", "Chattanooga", 35.05, -85.31,
         ["Gig city fiber legacy", "Manufacturing comeback", "Outdoor lifestyle"],
         ["bootstrap", "engineering", "saas"], "https://www.tn.gov/", "State of Tennessee"),
        ("knoxville", "Knoxville", 35.96, -83.92,
         ["Oak Ridge research adjacency", "University talent", "Affordable"],
         ["engineering", "healthcare", "bootstrap"], "https://www.tn.gov/", "State of Tennessee"),
    ],
    "AZ": [
        ("phoenix", "Phoenix", 33.45, -112.07,
         ["Fast population growth", "Semiconductor investments", "Business-friendly"],
         ["engineering", "saas", "logistics"], "https://az.gov/", "State of Arizona"),
        ("tucson", "Tucson", 32.22, -110.97,
         ["Optics & defense", "University of Arizona", "Lower COL"],
         ["engineering", "healthcare", "bootstrap"], "https://az.gov/", "State of Arizona"),
        ("scottsdale", "Scottsdale", 33.49, -111.93,
         ["Fintech & SaaS offices", "Quality of life", "Remote-friendly"],
         ["fintech", "saas", "bootstrap"], "https://az.gov/", "State of Arizona"),
    ],
    "UT": [
        ("salt-lake", "Salt Lake City", 40.76, -111.89,
         ["Silicon Slopes", "SaaS density", "Young talent pool"],
         ["saas", "engineering", "vc"], "https://www.utah.gov/", "State of Utah"),
        ("provo", "Provo", 40.23, -111.66,
         ["BYU pipeline", "Consumer tech", "Bootstrap-friendly"],
         ["saas", "bootstrap", "engineering"], "https://www.utah.gov/", "State of Utah"),
        ("lehi", "Lehi", 40.39, -111.85,
         ["Enterprise SaaS campus cluster", "Suburban COL advantage", "Tech corridor"],
         ["saas", "engineering", "vc"], "https://www.utah.gov/", "State of Utah"),
    ],
    "NV": [
        ("las-vegas", "Las Vegas", 36.17, -115.14,
         ["No state income tax", "Tourism-adjacent commerce", "Rapid growth"],
         ["ecommerce", "marketplace", "bootstrap"], "https://www.nv.gov/", "State of Nevada"),
        ("reno", "Reno", 39.53, -119.81,
         ["Tesla & logistics hub", "Tax advantages", "California spillover"],
         ["logistics", "engineering", "bootstrap"], "https://www.nv.gov/", "State of Nevada"),
        ("henderson", "Henderson", 36.04, -114.98,
         ["Suburban business parks", "Healthcare growth", "Lower COL"],
         ["healthcare", "saas", "bootstrap"], "https://www.nv.gov/", "State of Nevada"),
    ],
    "IL": [
        ("chicago", "Chicago", 41.88, -87.63,
         ["Midwest finance hub", "Fortune 500 HQ", "Deep talent bench"],
         ["finance", "fintech", "marketplace", "logistics"], "https://www.illinois.gov/", "State of Illinois"),
        ("champaign", "Champaign–Urbana", 40.11, -88.24,
         ["UIUC research pipeline", "Hard tech spinouts", "Affordable"],
         ["engineering", "saas", "bootstrap"], "https://www.illinois.gov/", "State of Illinois"),
        ("springfield", "Springfield", 39.78, -89.65,
         ["State capital", "Healthcare & gov tech", "Lower COL"],
         ["healthcare", "bootstrap", "saas"], "https://www.illinois.gov/", "State of Illinois"),
    ],
    "VA": [
        ("northern-va", "Northern Virginia", 38.90, -77.04,
         ["Federal contracting & cyber", "Data center corridor", "DC talent spillover"],
         ["engineering", "saas", "healthcare"], "https://www.virginia.gov/", "Commonwealth of Virginia"),
        ("richmond", "Richmond", 37.54, -77.44,
         ["Finance & insurance", "Lower COL", "Growing startup scene"],
         ["finance", "fintech", "bootstrap"], "https://www.virginia.gov/", "Commonwealth of Virginia"),
        ("norfolk", "Norfolk", 36.85, -76.29,
         ["Port & defense", "Coastal logistics", "Military-adjacent tech"],
         ["logistics", "engineering", "healthcare"], "https://www.virginia.gov/", "Commonwealth of Virginia"),
    ],
}

# Wave B — remaining states (abbreviated but complete)
WAVE_B: dict[str, list] = {
    "OH": [
        ("columbus", "Columbus", 39.96, -82.99, ["Insurance & retail HQ", "Affordable talent", "Midwest hub"], ["fintech", "ecommerce", "bootstrap"], "https://ohio.gov/", "State of Ohio"),
        ("cleveland", "Cleveland", 41.50, -81.69, ["Healthcare & manufacturing", "Lake logistics", "Revitalizing core"], ["healthcare", "engineering", "logistics"], "https://ohio.gov/", "State of Ohio"),
        ("cincinnati", "Cincinnati", 39.10, -84.51, ["Consumer brands HQ", "Cross-state talent", "Lower COL"], ["ecommerce", "finance", "bootstrap"], "https://ohio.gov/", "State of Ohio"),
    ],
    "MI": [
        ("detroit", "Detroit", 42.33, -83.05, ["Mobility & industrial tech", "Manufacturing base", "Urban revival"], ["engineering", "logistics", "saas"], "https://www.michigan.gov/", "State of Michigan"),
        ("ann-arbor", "Ann Arbor", 42.28, -83.74, ["University spinouts", "Research talent", "Life sciences"], ["engineering", "healthcare", "saas"], "https://www.michigan.gov/", "State of Michigan"),
        ("grand-rapids", "Grand Rapids", 42.96, -85.67, ["Furniture & medical devices", "Affordable COL", "Midwest quality of life"], ["healthcare", "bootstrap", "engineering"], "https://www.michigan.gov/", "State of Michigan"),
    ],
    "IN": [
        ("indianapolis", "Indianapolis", 39.77, -86.16, ["Logistics crossroads", "Sports & events economy", "Business-friendly"], ["logistics", "saas", "healthcare"], "https://www.in.gov/", "State of Indiana"),
        ("fort-wayne", "Fort Wayne", 41.08, -85.14, ["Manufacturing", "Low COL", "Stable workforce"], ["engineering", "bootstrap", "healthcare"], "https://www.in.gov/", "State of Indiana"),
        ("bloomington", "Bloomington", 39.17, -86.53, ["University research", "Life sciences", "Creative economy"], ["healthcare", "engineering", "saas"], "https://www.in.gov/", "State of Indiana"),
    ],
    "MN": [
        ("minneapolis", "Minneapolis–St. Paul", 44.98, -93.27, ["Retail & healthcare HQ", "Strong talent", "Stable economy"], ["healthcare", "finance", "saas"], "https://mn.gov/", "State of Minnesota"),
        ("rochester-mn", "Rochester", 44.02, -92.48, ["Mayo Clinic ecosystem", "Med tech", "Research talent"], ["healthcare", "engineering", "saas"], "https://mn.gov/", "State of Minnesota"),
        ("duluth", "Duluth", 46.79, -92.10, ["Port & natural resources", "Remote-friendly", "Lower COL"], ["logistics", "bootstrap", "healthcare"], "https://mn.gov/", "State of Minnesota"),
    ],
    "NE": [
        ("omaha", "Omaha", 41.26, -95.94, ["Finance & insurance", "Affordable operations", "Warren Buffett ecosystem"], ["finance", "fintech", "bootstrap"], "https://www.nebraska.gov/", "State of Nebraska"),
        ("lincoln", "Lincoln", 40.81, -96.68, ["State capital", "University talent", "Stable COL"], ["bootstrap", "healthcare", "saas"], "https://www.nebraska.gov/", "State of Nebraska"),
    ],
    "PA": [
        ("philadelphia", "Philadelphia", 39.95, -75.17, ["Life sciences corridor", "East Coast hub", "University talent"], ["healthcare", "saas", "fintech"], "https://www.pa.gov/", "Commonwealth of Pennsylvania"),
        ("pittsburgh", "Pittsburgh", 40.44, -79.99, ["Robotics & AI research", "Carnegie Mellon pipeline", "Affordable vs coasts"], ["engineering", "saas", "healthcare"], "https://www.pa.gov/", "Commonwealth of Pennsylvania"),
        ("harrisburg", "Harrisburg", 40.27, -76.88, ["State capital", "Gov tech adjacency", "Central location"], ["healthcare", "bootstrap", "saas"], "https://www.pa.gov/", "Commonwealth of Pennsylvania"),
    ],
    "SC": [
        ("charleston", "Charleston", 32.78, -79.93, ["Port & aerospace", "Quality of life", "Tourism commerce"], ["logistics", "engineering", "ecommerce"], "https://www.sc.gov/", "State of South Carolina"),
        ("greenville", "Greenville", 34.85, -82.40, ["Manufacturing growth", "BMW & automotive supply", "Lower COL"], ["engineering", "logistics", "bootstrap"], "https://www.sc.gov/", "State of South Carolina"),
        ("columbia-sc", "Columbia", 34.00, -81.03, ["State capital", "University talent", "Insurance cluster"], ["healthcare", "finance", "bootstrap"], "https://www.sc.gov/", "State of South Carolina"),
    ],
    "AL": [
        ("birmingham", "Birmingham", 33.52, -86.80, ["Healthcare & finance", "Low COL", "Central South hub"], ["healthcare", "finance", "bootstrap"], "https://www.alabama.gov/", "State of Alabama"),
        ("huntsville", "Huntsville", 34.73, -86.59, ["Aerospace & defense", "Engineering talent", "Fast growth"], ["engineering", "saas", "healthcare"], "https://www.alabama.gov/", "State of Alabama"),
        ("mobile", "Mobile", 30.69, -88.04, ["Port access", "Shipbuilding", "Coastal logistics"], ["logistics", "engineering", "bootstrap"], "https://www.alabama.gov/", "State of Alabama"),
    ],
    "WI": [
        ("milwaukee", "Milwaukee", 43.04, -87.91, ["Manufacturing & water tech", "Midwest talent", "Affordable"], ["engineering", "healthcare", "bootstrap"], "https://www.wisconsin.gov/", "State of Wisconsin"),
        ("madison", "Madison", 43.07, -89.40, ["University research", "Biotech", "Progressive talent pool"], ["healthcare", "saas", "engineering"], "https://www.wisconsin.gov/", "State of Wisconsin"),
    ],
    "IA": [
        ("des-moines", "Des Moines", 41.59, -93.62, ["Insurance & finance", "Stable economy", "Low COL"], ["finance", "fintech", "bootstrap"], "https://www.iowa.gov/", "State of Iowa"),
        ("cedar-rapids", "Cedar Rapids", 41.98, -91.67, ["Manufacturing", "Logistics", "Affordable"], ["logistics", "engineering", "bootstrap"], "https://www.iowa.gov/", "State of Iowa"),
    ],
    "KY": [
        ("louisville", "Louisville", 38.25, -85.76, ["Logistics hub", "UPS Worldport", "Healthcare"], ["logistics", "healthcare", "ecommerce"], "https://www.kentucky.gov/", "Commonwealth of Kentucky"),
        ("lexington", "Lexington", 38.04, -84.50, ["Equine & ag tech", "University talent", "Quality of life"], ["healthcare", "bootstrap", "engineering"], "https://www.kentucky.gov/", "Commonwealth of Kentucky"),
    ],
    "ND": [
        ("fargo", "Fargo", 46.88, -96.79, ["Ag tech & software", "Low unemployment", "Affordable"], ["saas", "bootstrap", "engineering"], "https://www.nd.gov/", "State of North Dakota"),
        ("bismarck", "Bismarck", 46.81, -100.78, ["Energy sector", "State capital", "Stable workforce"], ["energy", "healthcare", "bootstrap"], "https://www.nd.gov/", "State of North Dakota"),
    ],
    "ID": [
        ("boise", "Boise", 43.62, -116.20, ["Micron & tech growth", "Inbound migration", "Outdoor lifestyle"], ["engineering", "saas", "bootstrap"], "https://www.idaho.gov/", "State of Idaho"),
        ("coeur-dalene", "Coeur d'Alene", 47.68, -116.78, ["Remote workforce hub", "Tourism commerce", "Lower COL"], ["bootstrap", "ecommerce", "healthcare"], "https://www.idaho.gov/", "State of Idaho"),
    ],
    "CT": [
        ("hartford", "Hartford", 41.76, -72.68, ["Insurance capital", "Finance cluster", "East Coast access"], ["finance", "fintech", "healthcare"], "https://portal.ct.gov/", "State of Connecticut"),
        ("stamford", "Stamford", 41.05, -73.54, ["NYC spillover", "Corporate offices", "Finance talent"], ["finance", "fintech", "saas"], "https://portal.ct.gov/", "State of Connecticut"),
        ("new-haven", "New Haven", 41.31, -72.92, ["Yale research", "Biotech", "Healthcare"], ["healthcare", "engineering", "saas"], "https://portal.ct.gov/", "State of Connecticut"),
    ],
    "DE": [
        ("wilmington", "Wilmington", 39.74, -75.54, ["Corporate legal domicile", "Finance & credit", "No sales tax"], ["finance", "fintech", "bootstrap"], "https://delaware.gov/", "State of Delaware"),
        ("dover", "Dover", 39.16, -75.52, ["State capital", "Gov & healthcare", "Affordable"], ["healthcare", "bootstrap", "saas"], "https://delaware.gov/", "State of Delaware"),
    ],
    "NJ": [
        ("newark", "Newark", 40.74, -74.17, ["Port & logistics", "NYC adjacency", "Pharma corridor"], ["logistics", "healthcare", "fintech"], "https://www.nj.gov/", "State of New Jersey"),
        ("jersey-city", "Jersey City", 40.72, -74.04, ["Fintech & back-office", "NYC talent spillover", "Waterfront offices"], ["fintech", "finance", "saas"], "https://www.nj.gov/", "State of New Jersey"),
        ("princeton", "Princeton", 40.36, -74.65, ["Research & pharma", "University pipeline", "Premium talent"], ["healthcare", "engineering", "saas"], "https://www.nj.gov/", "State of New Jersey"),
    ],
    "WY": [
        ("cheyenne", "Cheyenne", 41.14, -104.82, ["No state income tax", "Data centers", "Business-friendly"], ["bootstrap", "saas", "logistics"], "https://www.wyo.gov/", "State of Wyoming"),
        ("casper", "Casper", 42.87, -106.31, ["Energy sector", "Low COL", "Central location"], ["energy", "bootstrap", "engineering"], "https://www.wyo.gov/", "State of Wyoming"),
    ],
    "MD": [
        ("baltimore", "Baltimore", 39.29, -76.61, ["BioHealth capital", "Port access", "Johns Hopkins ecosystem"], ["healthcare", "engineering", "saas"], "https://www.maryland.gov/", "State of Maryland"),
        ("bethesda", "Bethesda", 38.98, -77.10, ["Federal contracting", "Biotech", "DC spillover"], ["healthcare", "engineering", "saas"], "https://www.maryland.gov/", "State of Maryland"),
        ("frederick", "Frederick", 39.41, -77.41, ["Life sciences", "Affordable vs DC", "Growing tech"], ["healthcare", "bootstrap", "engineering"], "https://www.maryland.gov/", "State of Maryland"),
    ],
    "KS": [
        ("kansas-city-ks", "Kansas City", 39.11, -94.63, ["Logistics hub", "Affordable COL", "Cross-state metro"], ["logistics", "saas", "bootstrap"], "https://www.kansas.gov/", "State of Kansas"),
        ("wichita", "Wichita", 37.69, -97.34, ["Aviation manufacturing", "Industrial base", "Low COL"], ["engineering", "logistics", "bootstrap"], "https://www.kansas.gov/", "State of Kansas"),
    ],
    "MO": [
        ("st-louis", "St. Louis", 38.63, -90.20, ["Plant sciences & biotech", "Corporate HQ", "Central US location"], ["healthcare", "engineering", "finance"], "https://www.mo.gov/", "State of Missouri"),
        ("kansas-city-mo", "Kansas City", 39.10, -94.58, ["Animal health corridor", "Low COL", "Growing tech"], ["healthcare", "saas", "bootstrap"], "https://www.mo.gov/", "State of Missouri"),
        ("springfield-mo", "Springfield", 37.21, -93.29, ["Affordable Midwest hub", "Healthcare", "Logistics"], ["healthcare", "bootstrap", "logistics"], "https://www.mo.gov/", "State of Missouri"),
    ],
    "SD": [
        ("sioux-falls", "Sioux Falls", 43.55, -96.73, ["No state income tax", "Financial services", "Fast growth"], ["finance", "bootstrap", "healthcare"], "https://www.sd.gov/", "State of South Dakota"),
        ("rapid-city", "Rapid City", 44.08, -103.23, ["Tourism & outdoor", "Black Hills tech", "Low COL"], ["bootstrap", "ecommerce", "healthcare"], "https://www.sd.gov/", "State of South Dakota"),
    ],
    "NH": [
        ("manchester", "Manchester", 42.99, -71.45, ["No state income tax", "Boston spillover", "Manufacturing"], ["bootstrap", "engineering", "saas"], "https://www.nh.gov/", "State of New Hampshire"),
        ("portsmouth", "Portsmouth", 43.07, -70.76, ["Seacoast tech", "Quality of life", "Tourism commerce"], ["saas", "ecommerce", "bootstrap"], "https://www.nh.gov/", "State of New Hampshire"),
    ],
    "OK": [
        ("oklahoma-city", "Oklahoma City", 35.47, -97.52, ["Energy & aerospace", "Low COL", "Business-friendly"], ["energy", "engineering", "bootstrap"], "https://www.ok.gov/", "State of Oklahoma"),
        ("tulsa", "Tulsa", 36.15, -95.99, ["Energy transition", "Remote worker incentives", "Arts & culture"], ["energy", "bootstrap", "saas"], "https://www.ok.gov/", "State of Oklahoma"),
    ],
    "VT": [
        ("burlington", "Burlington", 44.48, -73.21, ["Quality of life", "Remote workforce", "Small business culture"], ["bootstrap", "healthcare", "saas"], "https://www.vermont.gov/", "State of Vermont"),
        ("montpelier", "Montpelier", 44.26, -72.58, ["State capital", "Gov & nonprofit hub", "Rural entrepreneurship"], ["bootstrap", "healthcare", "saas"], "https://www.vermont.gov/", "State of Vermont"),
    ],
    "OR": [
        ("portland", "Portland", 45.52, -122.68, ["SaaS & athletic brands", "Creative talent", "No sales tax"], ["saas", "ecommerce", "engineering"], "https://www.oregon.gov/", "State of Oregon"),
        ("eugene", "Eugene", 44.05, -123.09, ["University research", "Outdoor industry", "Affordable"], ["bootstrap", "engineering", "healthcare"], "https://www.oregon.gov/", "State of Oregon"),
        ("bend", "Bend", 44.06, -121.32, ["Remote worker magnet", "Tourism tech", "Quality of life"], ["bootstrap", "saas", "ecommerce"], "https://www.oregon.gov/", "State of Oregon"),
    ],
    "WV": [
        ("charleston-wv", "Charleston", 38.35, -81.63, ["State capital", "Energy transition", "Low COL"], ["energy", "healthcare", "bootstrap"], "https://www.wv.gov/", "State of West Virginia"),
        ("morgantown", "Morgantown", 39.63, -79.96, ["University research", "Healthcare", "Stable workforce"], ["healthcare", "engineering", "bootstrap"], "https://www.wv.gov/", "State of West Virginia"),
    ],
    "AR": [
        ("little-rock", "Little Rock", 34.75, -92.29, ["State capital", "Retail HQ (Walmart adjacency)", "Low COL"], ["ecommerce", "healthcare", "bootstrap"], "https://www.ar.gov/", "State of Arkansas"),
        ("fayetteville-ar", "Fayetteville", 36.06, -94.16, ["University talent", "Supply chain hub", "Growing tech"], ["ecommerce", "saas", "engineering"], "https://www.ar.gov/", "State of Arkansas"),
    ],
    "ME": [
        ("portland-me", "Portland", 43.66, -70.26, ["Quality of life", "Tourism commerce", "Remote-friendly"], ["bootstrap", "ecommerce", "healthcare"], "https://www.maine.gov/", "State of Maine"),
        ("bangor", "Bangor", 44.80, -68.78, ["Healthcare hub", "Affordable", "Regional services"], ["healthcare", "bootstrap", "logistics"], "https://www.maine.gov/", "State of Maine"),
    ],
    "NM": [
        ("albuquerque", "Albuquerque", 35.08, -106.65, ["Research labs", "Affordable Southwest", "Film & creative"], ["engineering", "healthcare", "bootstrap"], "https://www.nm.gov/", "State of New Mexico"),
        ("santa-fe", "Santa Fe", 35.69, -105.94, ["Arts & culture", "Remote workforce", "State capital"], ["bootstrap", "ecommerce", "healthcare"], "https://www.nm.gov/", "State of New Mexico"),
    ],
    "MS": [
        ("jackson-ms", "Jackson", 32.30, -90.18, ["State capital", "Healthcare", "Low COL"], ["healthcare", "bootstrap", "logistics"], "https://www.ms.gov/", "State of Mississippi"),
        ("gulfport", "Gulfport", 30.37, -89.09, ["Port & logistics", "Coastal commerce", "Affordable"], ["logistics", "bootstrap", "ecommerce"], "https://www.ms.gov/", "State of Mississippi"),
    ],
    "LA": [
        ("new-orleans", "New Orleans", 29.95, -90.07, ["Port & energy", "Tourism commerce", "Unique culture"], ["energy", "ecommerce", "healthcare"], "https://www.louisiana.gov/", "State of Louisiana"),
        ("baton-rouge", "Baton Rouge", 30.45, -91.19, ["State capital", "Petrochemical", "Industrial base"], ["energy", "engineering", "healthcare"], "https://www.louisiana.gov/", "State of Louisiana"),
        ("shreveport", "Shreveport", 32.53, -93.75, ["Affordable South", "Healthcare", "Logistics"], ["healthcare", "bootstrap", "logistics"], "https://www.louisiana.gov/", "State of Louisiana"),
    ],
    "RI": [
        ("providence", "Providence", 41.82, -71.41, ["University talent", "Design & creative", "Boston adjacency"], ["saas", "healthcare", "engineering"], "https://www.ri.gov/", "State of Rhode Island"),
        ("newport", "Newport", 41.49, -71.31, ["Tourism & defense", "Coastal commerce", "Quality of life"], ["ecommerce", "engineering", "bootstrap"], "https://www.ri.gov/", "State of Rhode Island"),
    ],
    "MT": [
        ("billings", "Billings", 45.78, -108.50, ["Energy & ag", "Regional hub", "Low COL"], ["energy", "bootstrap", "healthcare"], "https://mt.gov/", "State of Montana"),
        ("missoula", "Missoula", 46.87, -113.99, ["University town", "Outdoor industry", "Remote-friendly"], ["bootstrap", "ecommerce", "healthcare"], "https://mt.gov/", "State of Montana"),
    ],
    "HI": [
        ("honolulu", "Honolulu", 21.31, -157.86, ["Tourism & military", "Pacific gateway", "Unique market"], ["ecommerce", "healthcare", "bootstrap"], "https://portal.ehawaii.gov/", "State of Hawaii"),
        ("hilo", "Hilo", 19.71, -155.09, ["Ag & research", "Island logistics", "Lower COL vs Honolulu"], ["bootstrap", "healthcare", "engineering"], "https://portal.ehawaii.gov/", "State of Hawaii"),
    ],
    "AK": [
        ("anchorage", "Anchorage", 61.22, -149.90, ["Energy & logistics", "Arctic gateway", "Unique operating context"], ["energy", "logistics", "healthcare"], "https://alaska.gov/", "State of Alaska"),
        ("fairbanks", "Fairbanks", 64.84, -147.72, ["Research & military", "Interior hub", "Seasonal workforce"], ["engineering", "healthcare", "bootstrap"], "https://alaska.gov/", "State of Alaska"),
    ],
}

ALL_STATE_ABBRS = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]


def metro_entry(row: tuple) -> dict:
    id_, name, lat, lng, strengths, tags, url, label = row[:8]
    entry = {
        "id": id_,
        "name": name,
        "lat": lat,
        "lng": lng,
        "strengths": strengths,
        "industryTags": tags,
        "sourceUrl": url,
        "sourceLabel": label,
    }
    if len(row) > 8 and row[8]:
        entry["derivedNote"] = row[8]
    return entry


def build_payload() -> dict:
    combined = {**METROS, **WAVE_B}
    missing = [abbr for abbr in ALL_STATE_ABBRS if abbr not in combined]
    if missing:
        raise SystemExit(f"Missing metro data for: {', '.join(missing)}")

    states = {}
    for abbr in ALL_STATE_ABBRS:
        rows = combined[abbr]
        states[abbr] = {
            "stateAbbr": abbr,
            "metros": [metro_entry(row) for row in rows],
        }

    return {
        "version": 1,
        "disclaimer": DISCLAIMER,
        "states": states,
    }


def main() -> None:
    payload = build_payload()
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    OUT_DATA.write_text(text, encoding="utf-8")
    OUT_PUBLIC.write_text(text, encoding="utf-8")
    print(f"OK: wrote {len(payload['states'])} states to state_metros.json")


if __name__ == "__main__":
    main()
