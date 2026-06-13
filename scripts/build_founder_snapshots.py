"""
Build data/founder_snapshots.json — sourced operational facts per state (Phase 4).

Each fact requires value, sourceUrl, and sourceLabel. Run via CI / npm prebuild.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DATA = ROOT / "data" / "founder_snapshots.json"
OUT_PUBLIC = ROOT / "public" / "data" / "founder_snapshots.json"

# Shared reputable sources for multi-state awareness bullets
IRS_STATE_LINKS = {
    "value": "Multi-state operations often trigger registration, withholding, or nexus rules — confirm with official state agencies.",
    "sourceUrl": "https://www.irs.gov/businesses/small-businesses-self-employed/state-government-websites",
    "sourceLabel": "IRS — State government websites",
}

SBA_REGISTER = {
    "value": "If you are incorporated elsewhere but transact business here, you may need to foreign-qualify with the Secretary of State.",
    "sourceUrl": "https://www.sba.gov/business-guide/launch-your-business/register-your-business",
    "sourceLabel": "U.S. Small Business Administration",
}


def fact(value: str, source_url: str, source_label: str) -> dict:
    return {"value": value, "sourceUrl": source_url, "sourceLabel": source_label}


def heads_up(*bullets: dict) -> list:
    return list(bullets)


# Curated high-level facts with official source links — informational only, not tax advice.
SNAPSHOTS: dict[str, dict] = {
    "AL": {
        "taxPosture": fact(
            "Alabama taxes C-corporation income at 6.5% and personal income at rates up to 5%. Pass-through entities generally flow through to owners.",
            "https://www.revenue.alabama.gov/individual-corporate/taxes/",
            "Alabama Department of Revenue",
        ),
        "businessRegistration": fact(
            "Form corporations, LLCs, and other entities through the Alabama Secretary of State.",
            "https://www.sos.alabama.gov/business-entities",
            "Alabama Secretary of State",
        ),
        "complianceCalendar": fact(
            "Business privilege tax and annual report filings are required for many entities; due dates vary by entity type.",
            "https://www.revenue.alabama.gov/individual-corporate/business-privilege-tax/",
            "Alabama Department of Revenue — Business Privilege Tax",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote employees in Alabama can create payroll withholding and unemployment insurance obligations.",
                "https://www.revenue.alabama.gov/withholding/",
                "Alabama Department of Revenue — Withholding",
            ),
            fact(
                "Out-of-state sellers may owe Alabama sales/use tax once economic nexus thresholds are met.",
                "https://www.revenue.alabama.gov/sales-use/",
                "Alabama Department of Revenue — Sales & Use",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "AK": {
        "taxPosture": fact(
            "Alaska has no state personal income tax or statewide sales tax (local sales taxes may apply). Oil and industry taxes dominate state revenue.",
            "https://tax.alaska.gov/programs/programs/index.aspx",
            "Alaska Department of Revenue — Tax Division",
        ),
        "businessRegistration": fact(
            "Register businesses and obtain licenses through Alaska Commerce.",
            "https://www.commerce.alaska.gov/web/cbpl/BusinessLicensing.aspx",
            "Alaska Department of Commerce",
        ),
        "complianceCalendar": fact(
            "Biennial report and business license renewals apply to many entities; check Commerce for your entity type.",
            "https://www.commerce.alaska.gov/web/cbpl/BusinessLicensing/BiennialReport.aspx",
            "Alaska Department of Commerce — Biennial Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Hiring remote workers in Alaska triggers state unemployment and workers' comp requirements.",
                "https://labor.alaska.gov/estax/home.htm",
                "Alaska Department of Labor — Employment Tax",
            ),
            fact(
                "Local borough/city sales taxes apply in many Alaska communities — rates are not uniform statewide.",
                "https://tax.alaska.gov/programs/programs/index.aspx?6000",
                "Alaska Tax Division — Local Sales Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "AZ": {
        "taxPosture": fact(
            "Arizona corporate income tax is 4.9%; personal income tax uses a flat 2.5% rate (2025). Transaction Privilege Tax (TPT) applies to many business activities.",
            "https://azdor.gov/business",
            "Arizona Department of Revenue",
        ),
        "businessRegistration": fact(
            "File entity formations and annual reports with the Arizona Corporation Commission.",
            "https://azcc.gov/business",
            "Arizona Corporation Commission",
        ),
        "complianceCalendar": fact(
            "Annual reports are due to the Corporation Commission; TPT and corporate/income tax returns have separate DOR deadlines.",
            "https://azcc.gov/business/filings/annual-report",
            "Arizona Corporation Commission — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Marketplace and remote sales can create Arizona TPT collection obligations once nexus exists.",
                "https://azdor.gov/transaction-privilege-tax/tax-guidance/remote-sellers-marketplace-facilitators",
                "Arizona DOR — Remote Sellers",
            ),
            fact(
                "Employers with Arizona workers must register for withholding and unemployment insurance.",
                "https://azdes.gov/services/employment/unemployment-employer",
                "Arizona DES — Unemployment Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "AR": {
        "taxPosture": fact(
            "Arkansas corporate income tax tops out at 5.1%; personal income tax uses progressive rates up to 3.9%. Pass-through income is generally taxed at the owner level.",
            "https://www.dfa.arkansas.gov/income-tax/",
            "Arkansas Department of Finance and Administration",
        ),
        "businessRegistration": fact(
            "Form and maintain business entities through the Arkansas Secretary of State.",
            "https://www.sos.arkansas.gov/business-commercial-services-bcs",
            "Arkansas Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual franchise tax reports are due May 1 for corporations; LLC annual reports follow separate SOS deadlines.",
            "https://www.dfa.arkansas.gov/office/taxes/business-tax/franchise-tax",
            "Arkansas DFA — Franchise Tax",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote employees in Arkansas can trigger income tax withholding and unemployment tax accounts.",
                "https://www.dfa.arkansas.gov/income-tax/withholding-tax/",
                "Arkansas DFA — Withholding",
            ),
            fact(
                "Out-of-state retailers may need to collect Arkansas sales tax after exceeding economic nexus thresholds.",
                "https://www.dfa.arkansas.gov/office/taxes/sales-use-tax",
                "Arkansas DFA — Sales & Use Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "CA": {
        "taxPosture": fact(
            "California taxes C-corporation income at 8.84% (plus potential LLC fee/Minimum Franchise Tax of $800). Personal income tax is progressive up to 12.3% (plus Mental Health Services Tax on high earners).",
            "https://www.ftb.ca.gov/businesses/index.html",
            "California Franchise Tax Board",
        ),
        "businessRegistration": fact(
            "Register corporations and LLCs via the California Secretary of State (BizFile Online).",
            "https://bizfileonline.sos.ca.gov/",
            "California Secretary of State — BizFile",
        ),
        "complianceCalendar": fact(
            "Statement of Information due every 1–2 years depending on entity; FTB returns and $800 minimum franchise tax apply to most entities.",
            "https://www.sos.ca.gov/business-programs/business-entities/statements",
            "California SOS — Statements of Information",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "California aggressively asserts nexus for out-of-state companies selling to CA customers or employing CA residents.",
                "https://www.cdtfa.ca.gov/industry/remote-sellers.htm",
                "California CDTFA — Remote Sellers",
            ),
            fact(
                "Apportioning multi-state income to California uses market-based rules for many taxpayers.",
                "https://www.ftb.ca.gov/file/business/types/multistate-businesses/index.html",
                "California FTB — Multistate Businesses",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "CO": {
        "taxPosture": fact(
            "Colorado corporate income tax is 4.4% (flat). Personal income tax is a flat 4.4%. Many local jurisdictions add separate occupational privilege taxes.",
            "https://tax.colorado.gov/business-tax",
            "Colorado Department of Revenue",
        ),
        "businessRegistration": fact(
            "File entity formations and periodic reports with the Colorado Secretary of State.",
            "https://www.sos.state.co.us/pubs/business/main.html",
            "Colorado Secretary of State",
        ),
        "complianceCalendar": fact(
            "Periodic reports are due to the Secretary of State; income and sales tax returns follow DOR schedules.",
            "https://www.sos.state.co.us/pubs/business/FAQs/periodicReports.html",
            "Colorado SOS — Periodic Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Colorado economic nexus rules require remote sellers to collect sales tax above state thresholds.",
                "https://tax.colorado.gov/out-of-state-businesses",
                "Colorado DOR — Out-of-State Businesses",
            ),
            fact(
                "Employers with Colorado workers must register for withholding and unemployment insurance.",
                "https://cdle.colorado.gov/employers/unemployment-insurance-ui",
                "Colorado Department of Labor — UI",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "CT": {
        "taxPosture": fact(
            "Connecticut corporate tax tops out at 7.5% with a 10% surcharge on larger liabilities. Personal income tax is progressive up to 6.99%. Pass-through entity tax (PET) may apply.",
            "https://portal.ct.gov/drs/business/business",
            "Connecticut Department of Revenue Services",
        ),
        "businessRegistration": fact(
            "Register business entities through Connecticut Business Services (Secretary of the State).",
            "https://portal.ct.gov/SOTS/Business-Services/Business-Services",
            "Connecticut Secretary of the State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due to the Secretary of the State; corporate and PET returns follow DRS deadlines.",
            "https://portal.ct.gov/SOTS/Business-Services/All-Business-Services/Annual-Reports",
            "Connecticut SOS — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote workers in Connecticut can create income tax withholding obligations for employers.",
                "https://portal.ct.gov/drs/withholding-tax/withholding-tax",
                "Connecticut DRS — Withholding",
            ),
            fact(
                "Marketplace and remote sellers must register once Connecticut economic nexus thresholds are exceeded.",
                "https://portal.ct.gov/drs/sales-tax/sales-tax",
                "Connecticut DRS — Sales Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "DE": {
        "taxPosture": fact(
            "Delaware has no state sales tax. Corporations pay annual franchise tax (often minimum $175–$400 for small corps using authorized-shares method). No personal income tax on non-resident passive income from DE entities.",
            "https://revenue.delaware.gov/business-tax-forms/delaware-corporate-income-tax/",
            "Delaware Division of Revenue",
        ),
        "businessRegistration": fact(
            "Delaware is a common incorporation domicile — file through the Division of Corporations.",
            "https://corp.delaware.gov/",
            "Delaware Division of Corporations",
        ),
        "complianceCalendar": fact(
            "Annual franchise tax and annual report are due March 1 for corporations; LLCs pay $300 annual tax due June 1.",
            "https://corp.delaware.gov/paytaxes/",
            "Delaware Division of Corporations — Franchise Tax",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Incorporating in Delaware does not exempt you from registering in states where you operate (foreign qualification).",
                "https://corp.delaware.gov/howtoform/",
                "Delaware Division of Corporations",
            ),
            fact(
                "Delaware employers must register for withholding and unemployment insurance.",
                "https://revenue.delaware.gov/business-tax-forms/withholding-tax/",
                "Delaware Division of Revenue — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "FL": {
        "taxPosture": fact(
            "Florida has no personal income tax. C-corporations pay 5.5% corporate income tax (with $50,000 exemption). Sales tax is 6% plus local surtax in many counties.",
            "https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx",
            "Florida Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through Sunbiz (Florida Division of Corporations).",
            "https://dos.fl.gov/sunbiz/",
            "Florida Sunbiz",
        ),
        "complianceCalendar": fact(
            "Annual reports are due May 1 for most entities; late fees apply. Corporate income tax returns follow separate DOR deadlines.",
            "https://dos.fl.gov/sunbiz/manage-business/efile/annual-report/",
            "Florida Sunbiz — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers and marketplace facilitators must collect Florida sales tax once economic nexus thresholds are met.",
                "https://floridarevenue.com/taxes/taxesfees/Pages/remote_seller.aspx",
                "Florida DOR — Remote Seller",
            ),
            fact(
                "Employers with Florida workers register for reemployment (unemployment) tax and new hire reporting.",
                "https://floridarevenue.com/taxes/taxesfees/Pages/reemployment.aspx",
                "Florida DOR — Reemployment Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "GA": {
        "taxPosture": fact(
            "Georgia corporate income tax is 5.75%. Personal income tax is a flat 5.49% (2025). Net worth tax applies to many corporations.",
            "https://dor.georgia.gov/business-taxes",
            "Georgia Department of Revenue",
        ),
        "businessRegistration": fact(
            "Form and maintain entities through the Georgia Corporations Division.",
            "https://sos.ga.gov/corporations-division",
            "Georgia Secretary of State — Corporations",
        ),
        "complianceCalendar": fact(
            "Annual registrations are due April 1 between Jan 1 and Apr 1 each year; corporate net worth tax returns have separate deadlines.",
            "https://sos.ga.gov/corporations-division/corporations/annual-registration",
            "Georgia SOS — Annual Registration",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Out-of-state vendors may owe Georgia sales tax once economic nexus thresholds are exceeded.",
                "https://dor.georgia.gov/taxes/sales-use-tax",
                "Georgia DOR — Sales & Use Tax",
            ),
            fact(
                "Georgia employers must withhold state income tax and register for unemployment insurance.",
                "https://dor.georgia.gov/taxes/withholding-tax-employers",
                "Georgia DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "HI": {
        "taxPosture": fact(
            "Hawaii uses the General Excise Tax (GET) on gross receipts (not a traditional sales tax). Corporate income tax rates range up to 6.4%; personal income tax is progressive up to 11%.",
            "https://tax.hawaii.gov/geninfo/get/",
            "Hawaii Department of Taxation — GET",
        ),
        "businessRegistration": fact(
            "Register businesses through the Hawaii Business Registration Division.",
            "https://cca.hawaii.gov/breg/",
            "Hawaii Business Registration",
        ),
        "complianceCalendar": fact(
            "Annual reports and business registrations renew through the Business Registration Division; GET returns are filed separately.",
            "https://cca.hawaii.gov/breg/registration/",
            "Hawaii Business Registration — Renewals",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers into Hawaii may have GET obligations once activity thresholds are met.",
                "https://tax.hawaii.gov/geninfo/get/marketplace-facilitators/",
                "Hawaii DOT — Marketplace Facilitators",
            ),
            fact(
                "Employers with Hawaii workers must register for withholding and unemployment insurance.",
                "https://labor.hawaii.gov/ui/employer-resources/",
                "Hawaii DLIR — UI for Employers",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "ID": {
        "taxPosture": fact(
            "Idaho corporate income tax is a flat 5.8%. Personal income tax is a flat 5.695% (2025). No franchise tax on most small entities.",
            "https://tax.idaho.gov/taxes/business/",
            "Idaho State Tax Commission",
        ),
        "businessRegistration": fact(
            "File entity formations and annual reports with the Idaho Secretary of State.",
            "https://sos.idaho.gov/business-services/",
            "Idaho Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the end of the anniversary month of formation; income tax returns follow separate deadlines.",
            "https://sos.idaho.gov/annual-report/",
            "Idaho SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Idaho sales tax once economic nexus thresholds are exceeded.",
                "https://tax.idaho.gov/taxes/sales-use/remote-sellers/",
                "Idaho Tax Commission — Remote Sellers",
            ),
            fact(
                "Idaho employers register for withholding and unemployment insurance when hiring in-state workers.",
                "https://tax.idaho.gov/taxes/income-tax/withholding/",
                "Idaho Tax Commission — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "IL": {
        "taxPosture": fact(
            "Illinois corporate income tax is 7% plus 2.5% Personal Property Replacement Tax (9.5% combined for C-corps). Personal income tax is a flat 4.95%.",
            "https://tax.illinois.gov/research/taxinformation/income.html",
            "Illinois Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Illinois Secretary of State Business Services.",
            "https://www.ilsos.gov/departments/business_services/",
            "Illinois Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due before the first day of the anniversary month; franchise taxes may apply to corporations.",
            "https://www.ilsos.gov/departments/business_services/annual_reports.html",
            "Illinois SOS — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Illinois requires remote sellers and marketplace facilitators to collect Retailers' Occupation Tax once nexus exists.",
                "https://tax.illinois.gov/research/taxinformation/sales/rot.html",
                "Illinois DOR — Remote Sellers",
            ),
            fact(
                "Employers with Illinois workers must register for withholding and unemployment insurance.",
                "https://tax.illinois.gov/individuals/withholding.html",
                "Illinois DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "IN": {
        "taxPosture": fact(
            "Indiana corporate tax rate is 4.9%. Personal income tax is a flat 3.0% (2025). County income taxes may apply to individuals.",
            "https://www.in.gov/dor/business-tax/corporate-income-tax/",
            "Indiana Department of Revenue",
        ),
        "businessRegistration": fact(
            "Form entities and file business reports through the Indiana Secretary of State.",
            "https://www.in.gov/sos/business/",
            "Indiana Secretary of State",
        ),
        "complianceCalendar": fact(
            "Business entity reports are due every two years; corporate income tax returns follow DOR schedules.",
            "https://www.in.gov/sos/business/business-filings/",
            "Indiana SOS — Business Filings",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must register for Indiana sales tax once economic nexus thresholds are met.",
                "https://www.in.gov/dor/business-tax/sales-tax/",
                "Indiana DOR — Sales Tax",
            ),
            fact(
                "Indiana employers must withhold state income tax and pay unemployment insurance.",
                "https://www.in.gov/dor/business-tax/withholding-tax/",
                "Indiana DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "IA": {
        "taxPosture": fact(
            "Iowa corporate income tax tops out at 7.1% (graduated). Personal income tax is a flat 3.8% (2025). Pass-through income generally flows to owners.",
            "https://tax.iowa.gov/businesses",
            "Iowa Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register business entities through the Iowa Secretary of State.",
            "https://sos.iowa.gov/business/",
            "Iowa Secretary of State",
        ),
        "complianceCalendar": fact(
            "Biennial reports are due in odd-numbered years by April 1 for corporations and LLCs.",
            "https://sos.iowa.gov/business/biennial.html",
            "Iowa SOS — Biennial Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Marketplace facilitators and remote sellers must collect Iowa sales tax once nexus thresholds are exceeded.",
                "https://tax.iowa.gov/marketplace-facilitators",
                "Iowa DOR — Marketplace Facilitators",
            ),
            fact(
                "Iowa employers register for withholding and unemployment insurance when hiring in-state workers.",
                "https://tax.iowa.gov/withholding-tax",
                "Iowa DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "KS": {
        "taxPosture": fact(
            "Kansas corporate income tax tops out at 7.0%. Personal income tax uses progressive rates up to 5.58%. Pass-through entities may elect entity-level tax.",
            "https://www.ksrevenue.gov/businesstax.html",
            "Kansas Department of Revenue",
        ),
        "businessRegistration": fact(
            "Form entities and file annual reports with the Kansas Secretary of State.",
            "https://www.sos.ks.gov/business/business.html",
            "Kansas Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the 15th day of the fourth month after fiscal year end for corporations.",
            "https://www.sos.ks.gov/business/annual_report.html",
            "Kansas SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Kansas sales tax once economic nexus thresholds are exceeded.",
                "https://www.ksrevenue.gov/bustaxtypessales.html",
                "Kansas DOR — Sales Tax",
            ),
            fact(
                "Kansas employers must register for withholding and unemployment insurance.",
                "https://www.ksrevenue.gov/bustaxtypeswithhold.html",
                "Kansas DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "KY": {
        "taxPosture": fact(
            "Kentucky taxes corporate income at 5% (LLC entity-level tax also 5% on Kentucky gross receipts/profits). Personal income tax is a flat 4.0% (2025).",
            "https://revenue.ky.gov/Business/Pages/Corporation-Income-Tax.aspx",
            "Kentucky Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Kentucky Secretary of State.",
            "https://web.sos.ky.gov/ftsearch/",
            "Kentucky Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due between Jan 1 and Jun 30 each year; LLET (limited liability entity tax) may apply.",
            "https://web.sos.ky.gov/annualreport/",
            "Kentucky SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Kentucky sales tax once economic nexus thresholds are met.",
                "https://revenue.ky.gov/Business/Pages/Sales-Use-Tax.aspx",
                "Kentucky DOR — Sales & Use Tax",
            ),
            fact(
                "Kentucky employers register for withholding and unemployment insurance.",
                "https://revenue.ky.gov/Employer/Pages/Employer-Withholding.aspx",
                "Kentucky DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "LA": {
        "taxPosture": fact(
            "Louisiana corporate franchise and income taxes apply to most corporations; personal income tax is progressive up to 4.25%. Sales tax combines state and local rates.",
            "https://revenue.louisiana.gov/Businesses",
            "Louisiana Department of Revenue",
        ),
        "businessRegistration": fact(
            "Form entities through the Louisiana Secretary of State Commercial Division.",
            "https://www.sos.la.gov/BusinessServices/Pages/default.aspx",
            "Louisiana Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due on the anniversary date of formation; franchise tax returns follow separate LDR deadlines.",
            "https://www.sos.la.gov/BusinessServices/Pages/AnnualReports.aspx",
            "Louisiana SOS — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Louisiana remote seller rules require sales tax collection once economic nexus thresholds are exceeded.",
                "https://revenue.louisiana.gov/Businesses/Remote-Sellers",
                "Louisiana DOR — Remote Sellers",
            ),
            fact(
                "Employers with Louisiana workers must register for withholding and unemployment insurance.",
                "https://revenue.louisiana.gov/Businesses/Withholding",
                "Louisiana DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "ME": {
        "taxPosture": fact(
            "Maine corporate income tax tops out at 8.2%. Personal income tax is progressive up to 7.15%. Franchise tax may apply to C-corps with Maine property/payroll.",
            "https://www.maine.gov/revenue/taxes/income-estate-tax/corporate-income-tax",
            "Maine Revenue Services",
        ),
        "businessRegistration": fact(
            "Register entities through the Maine Secretary of State Corporations Division.",
            "https://www.maine.gov/sos/corporations-commissions",
            "Maine Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Jun 1 each year; corporate income tax returns follow MRS deadlines.",
            "https://www.maine.gov/sos/corporations-commissions/annual-reports",
            "Maine SOS — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Maine sales tax once economic nexus thresholds are exceeded.",
                "https://www.maine.gov/revenue/taxes/sales-use-service-provider-tax",
                "Maine Revenue Services — Sales Tax",
            ),
            fact(
                "Maine employers register for withholding and unemployment insurance.",
                "https://www.maine.gov/revenue/taxes/income-estate-tax/employer-withholding",
                "Maine Revenue Services — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MD": {
        "taxPosture": fact(
            "Maryland corporate income tax is 8.25%. Personal income tax is progressive up to 5.75% (plus county taxes). Pass-through entity tax election available.",
            "https://www.marylandtaxes.gov/business/index.php",
            "Comptroller of Maryland",
        ),
        "businessRegistration": fact(
            "Register entities through Maryland Business Express (State Department of Assessments and Taxation).",
            "https://egov.maryland.gov/BusinessExpress/",
            "Maryland Business Express",
        ),
        "complianceCalendar": fact(
            "Annual reports and personal property returns are due Apr 15 each year for most entities.",
            "https://egov.maryland.gov/BusinessExpress/AnnualReport",
            "Maryland Business Express — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Maryland sales and use tax once economic nexus thresholds are met.",
                "https://www.marylandtaxes.gov/business/sales-and-use-tax/index.php",
                "Comptroller of Maryland — Sales & Use",
            ),
            fact(
                "Maryland employers must register for withholding and unemployment insurance.",
                "https://www.marylandtaxes.gov/business/withholding/index.php",
                "Comptroller of Maryland — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MA": {
        "taxPosture": fact(
            "Massachusetts corporate excise tax combines 8% income tax with a property/net-worth component (minimum $456 for many corporations). Personal income tax is a flat 5.0%.",
            "https://www.mass.gov/guides/corporate-excise-tax-overview",
            "Massachusetts DOR — Corporate Excise",
        ),
        "businessRegistration": fact(
            "Form entities through the Massachusetts Corporations Division.",
            "https://www.sec.state.ma.us/divisions/corporations/corporations.htm",
            "Massachusetts Corporations Division",
        ),
        "complianceCalendar": fact(
            "Annual reports are due on the anniversary of formation; corporate excise returns follow DOR deadlines.",
            "https://www.sec.state.ma.us/divisions/corporations/general/annual-reports/annual-reports.htm",
            "Massachusetts Corporations — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Massachusetts requires remote vendors and marketplace facilitators to collect sales tax once nexus exists.",
                "https://www.mass.gov/guides/sales-and-use-tax",
                "Massachusetts DOR — Sales & Use Tax",
            ),
            fact(
                "Employers with Massachusetts workers must register for withholding and unemployment insurance.",
                "https://www.mass.gov/guides/withholding-tax",
                "Massachusetts DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MI": {
        "taxPosture": fact(
            "Michigan corporate income tax is 6%. Personal income tax is a flat 4.25%. Flow-through entities generally pass income to owners.",
            "https://www.michigan.gov/taxes/business-taxes/corporate-income-tax",
            "Michigan Department of Treasury",
        ),
        "businessRegistration": fact(
            "Register entities through Michigan LARA Corporations Division.",
            "https://www.michigan.gov/lara/bureau-services/businesses",
            "Michigan LARA — Corporations",
        ),
        "complianceCalendar": fact(
            "Annual statements are due May 15 for corporations and Feb 15 for LLCs; CIT returns follow separate deadlines.",
            "https://www.michigan.gov/lara/bureau-services/businesses/annual-statements",
            "Michigan LARA — Annual Statements",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers and marketplace facilitators must collect Michigan sales tax once nexus thresholds are exceeded.",
                "https://www.michigan.gov/taxes/business-taxes/sales-use-tax",
                "Michigan Treasury — Sales & Use Tax",
            ),
            fact(
                "Michigan employers register for withholding and unemployment insurance.",
                "https://www.michigan.gov/taxes/business-taxes/withholding",
                "Michigan Treasury — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MN": {
        "taxPosture": fact(
            "Minnesota corporate franchise tax rate is 9.8%. Personal income tax is progressive up to 9.85%. Pass-through entity tax election available.",
            "https://www.revenue.state.mn.us/businesses",
            "Minnesota Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Minnesota Secretary of State Business Services.",
            "https://www.sos.mn.gov/business-liens/",
            "Minnesota Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual renewals are due Dec 31 each year for corporations and LLCs.",
            "https://www.sos.mn.gov/business-liens/business-forms-fees/annual-renewal/",
            "Minnesota SOS — Annual Renewal",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Minnesota sales tax once economic nexus thresholds are exceeded.",
                "https://www.revenue.state.mn.us/sales-and-use-tax",
                "Minnesota DOR — Sales & Use Tax",
            ),
            fact(
                "Minnesota employers must register for withholding and unemployment insurance.",
                "https://www.revenue.state.mn.us/withholding-tax",
                "Minnesota DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MS": {
        "taxPosture": fact(
            "Mississippi corporate income tax tops out at 5%. Personal income tax is a flat 4.7% (2025). Franchise tax applies to C-corps and S-corps with MS capital.",
            "https://www.dor.ms.gov/business/corporate-income-and-franchise-tax",
            "Mississippi Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Mississippi Secretary of State Business Services.",
            "https://www.sos.ms.gov/business-services",
            "Mississippi Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Apr 15 each year; corporate/franchise tax returns follow DOR schedules.",
            "https://www.sos.ms.gov/business-services/annual-report",
            "Mississippi SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Mississippi sales tax once economic nexus thresholds are met.",
                "https://www.dor.ms.gov/business/sales-tax",
                "Mississippi DOR — Sales Tax",
            ),
            fact(
                "Mississippi employers register for withholding and unemployment insurance.",
                "https://www.dor.ms.gov/individual/withholding-tax",
                "Mississippi DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MO": {
        "taxPosture": fact(
            "Missouri corporate income tax is 4%. Personal income tax tops out at 4.7% (2025). No statewide franchise tax for most LLCs.",
            "https://dor.mo.gov/business/corporate/",
            "Missouri Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Missouri Secretary of State Business Services.",
            "https://www.sos.mo.gov/business",
            "Missouri Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual registration reports are due by the end of the registration anniversary month.",
            "https://www.sos.mo.gov/business/corporations/annual-registration",
            "Missouri SOS — Annual Registration",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Missouri use tax once economic nexus thresholds are exceeded.",
                "https://dor.mo.gov/business/sales/",
                "Missouri DOR — Sales & Use Tax",
            ),
            fact(
                "Missouri employers must register for withholding and unemployment insurance.",
                "https://dor.mo.gov/business/withhold/",
                "Missouri DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "MT": {
        "taxPosture": fact(
            "Montana has no statewide sales tax. Corporate income tax tops out at 6.75%; personal income tax is progressive up to 5.9%.",
            "https://mtrevenue.gov/taxes/business/",
            "Montana Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Montana Secretary of State Business Services.",
            "https://sosmt.gov/business/",
            "Montana Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Apr 15 each year; corporate income tax returns follow DOR deadlines.",
            "https://sosmt.gov/business/annual-report/",
            "Montana SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Montana employers register for withholding and unemployment insurance when hiring in-state workers.",
                "https://mtrevenue.gov/taxes/business/withholding-tax/",
                "Montana DOR — Withholding",
            ),
            fact(
                "Resort and local option taxes apply in some Montana communities despite no statewide sales tax.",
                "https://mtrevenue.gov/taxes/general-sales-tax/",
                "Montana DOR — Sales Tax Overview",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NE": {
        "taxPosture": fact(
            "Nebraska corporate income tax tops out at 7.25%. Personal income tax is progressive up to 5.84%.",
            "https://revenue.nebraska.gov/businesses/corporate-income-tax",
            "Nebraska Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Nebraska Secretary of State Business Services.",
            "https://www.nebraska.gov/sos/business/index.cgi",
            "Nebraska Secretary of State",
        ),
        "complianceCalendar": fact(
            "Biennial reports are due in even-numbered years by Apr 1 for corporations; LLC reports follow SOS rules.",
            "https://www.nebraska.gov/sos/business/biennial/index.cgi",
            "Nebraska SOS — Biennial Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Nebraska sales tax once economic nexus thresholds are exceeded.",
                "https://revenue.nebraska.gov/businesses/sales-and-use-tax",
                "Nebraska DOR — Sales & Use Tax",
            ),
            fact(
                "Nebraska employers register for withholding and unemployment insurance.",
                "https://revenue.nebraska.gov/businesses/income-tax-withholding",
                "Nebraska DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NV": {
        "taxPosture": fact(
            "Nevada has no corporate or personal income tax. The Commerce Tax applies to businesses with Nevada gross revenue exceeding $4 million.",
            "https://tax.nv.gov/business/commerce-tax/",
            "Nevada Department of Taxation — Commerce Tax",
        ),
        "businessRegistration": fact(
            "Register entities through the Nevada Secretary of State SilverFlume portal.",
            "https://www.nvsos.gov/sos/businesses",
            "Nevada Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual lists and business license renewals are due by the last day of the anniversary month; Commerce Tax returns have separate deadlines.",
            "https://www.nvsos.gov/sos/businesses/annual-lists-and-business-license-renewals",
            "Nevada SOS — Annual Lists",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Nevada employers register for Modified Business Tax and unemployment insurance.",
                "https://tax.nv.gov/business/modified-business-tax/",
                "Nevada Department of Taxation — MBT",
            ),
            fact(
                "High-revenue Nevada operations may owe Commerce Tax even without traditional income tax.",
                "https://tax.nv.gov/business/commerce-tax/frequently-asked-questions/",
                "Nevada Department of Taxation — Commerce Tax FAQ",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NH": {
        "taxPosture": fact(
            "New Hampshire has no tax on wage income. The Business Profits Tax (BPT) and Business Enterprise Tax (BET) apply to many businesses above filing thresholds.",
            "https://www.revenue.nh.gov/businesses/taxes/business-profits-tax",
            "New Hampshire Department of Revenue Administration",
        ),
        "businessRegistration": fact(
            "Register entities through the New Hampshire Secretary of State Corporations Division.",
            "https://www.sos.nh.gov/corporations",
            "New Hampshire Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Apr 1 each year; BPT/BET returns follow DRA deadlines.",
            "https://www.sos.nh.gov/corporations/annual-report",
            "New Hampshire SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect New Hampshire meals and rooms taxes where applicable; no broad sales tax but targeted taxes exist.",
                "https://www.revenue.nh.gov/faq/business-enterprise-tax",
                "New Hampshire DRA — Business Taxes",
            ),
            fact(
                "Employers with New Hampshire workers register for unemployment insurance (no wage income tax withholding).",
                "https://www.nhemploymentsecurity.org/employers/employer-index.asp",
                "NH Employment Security",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NJ": {
        "taxPosture": fact(
            "New Jersey corporate business tax tops out at 9% (plus surcharges on larger liabilities). Personal income tax is progressive up to 10.75%.",
            "https://www.nj.gov/treasury/taxation/cbt/",
            "New Jersey Division of Taxation — CBT",
        ),
        "businessRegistration": fact(
            "Register entities through the New Jersey Division of Revenue and Enterprise Services.",
            "https://www.nj.gov/treasury/revenue/",
            "New Jersey Division of Revenue",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the end of the anniversary month; CBT returns follow separate deadlines.",
            "https://www.nj.gov/treasury/revenue/annualreport.shtml",
            "New Jersey Division of Revenue — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect New Jersey sales tax once economic nexus thresholds are exceeded.",
                "https://www.nj.gov/treasury/taxation/salesanduse.shtml",
                "New Jersey Division of Taxation — Sales & Use",
            ),
            fact(
                "New Jersey employers must register for withholding and unemployment insurance.",
                "https://www.nj.gov/treasury/taxation/employer.shtml",
                "New Jersey Division of Taxation — Employers",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NM": {
        "taxPosture": fact(
            "New Mexico uses Gross Receipts Tax (GRT) on business receipts rather than a traditional sales tax. Corporate income tax tops out at 5.9%; personal income tax is progressive up to 5.9%.",
            "https://www.tax.newmexico.gov/businesses/gross-receipts-tax/",
            "New Mexico Taxation and Revenue Department",
        ),
        "businessRegistration": fact(
            "Register entities through the New Mexico Secretary of State Business Services.",
            "https://www.sos.nm.gov/business-services/",
            "New Mexico Secretary of State",
        ),
        "complianceCalendar": fact(
            "Biennial reports are due in odd-numbered years; GRT and corporate returns follow TRD schedules.",
            "https://www.sos.nm.gov/business-services/business-maintenance/",
            "New Mexico SOS — Business Maintenance",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers and marketplace providers may owe New Mexico GRT once economic nexus thresholds are met.",
                "https://www.tax.newmexico.gov/businesses/marketplace-providers/",
                "New Mexico TRD — Marketplace Providers",
            ),
            fact(
                "New Mexico employers register for withholding and unemployment insurance.",
                "https://www.tax.newmexico.gov/businesses/wage-withholding-tax/",
                "New Mexico TRD — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NY": {
        "taxPosture": fact(
            "New York corporate franchise tax includes Article 9-A rates up to 7.25% plus fixed dollar minimums for many corporations. Personal income tax is progressive up to 10.9% (NYC adds local tax).",
            "https://www.tax.ny.gov/bus/ct/",
            "New York State Department of Taxation and Finance",
        ),
        "businessRegistration": fact(
            "Register entities through the New York Department of State Division of Corporations.",
            "https://www.ny.gov/services/start-business-new-york",
            "New York State — Start a Business",
        ),
        "complianceCalendar": fact(
            "Biennial statements are due for corporations; franchise tax returns follow DTF deadlines.",
            "https://dos.ny.gov/forming-business-new-york-state",
            "NY Department of State — Forming a Business",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "New York economic nexus rules require remote sellers to register once sales thresholds are exceeded.",
                "https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/out_of_state_vendors.htm",
                "NY DTF — Out-of-State Vendors",
            ),
            fact(
                "Employers with New York workers must register for withholding, paid family leave, and unemployment insurance.",
                "https://www.tax.ny.gov/bus/ct/register.htm",
                "NY DTF — Employer Registration",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "NC": {
        "taxPosture": fact(
            "North Carolina corporate income tax is 2.5%. Personal income tax is a flat 4.5% (2025). Franchise tax applies to corporations doing business in NC.",
            "https://www.ncdor.gov/taxes-forms/corporate-income-tax",
            "North Carolina Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the North Carolina Secretary of State Business Registration.",
            "https://www.sosnc.gov/online_services/search/by_title/_Business_Registration",
            "North Carolina Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Apr 15 each year; franchise and corporate tax returns follow DOR deadlines.",
            "https://www.sosnc.gov/online_services/annual_report",
            "North Carolina SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect North Carolina sales tax once economic nexus thresholds are exceeded.",
                "https://www.ncdor.gov/taxes-forms/sales-and-use-tax",
                "North Carolina DOR — Sales & Use Tax",
            ),
            fact(
                "North Carolina employers register for withholding and unemployment insurance.",
                "https://www.ncdor.gov/taxes-forms/withholding-tax",
                "North Carolina DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "ND": {
        "taxPosture": fact(
            "North Dakota corporate income tax tops out at 4.31%. Personal income tax is progressive up to 2.5% (2025).",
            "https://www.tax.nd.gov/business/corporate-income-tax",
            "North Dakota Office of State Tax Commissioner",
        ),
        "businessRegistration": fact(
            "Register entities through North Dakota FirstStop (Secretary of State).",
            "https://firststop.sos.nd.gov/",
            "North Dakota FirstStop",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Nov 15 each year; corporate income tax returns follow Tax Commissioner deadlines.",
            "https://firststop.sos.nd.gov/annual-report",
            "North Dakota FirstStop — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect North Dakota sales tax once economic nexus thresholds are exceeded.",
                "https://www.tax.nd.gov/business/sales-and-use-tax",
                "North Dakota Tax Commissioner — Sales & Use",
            ),
            fact(
                "North Dakota employers register for withholding and unemployment insurance.",
                "https://www.tax.nd.gov/business/income-tax-withholding",
                "North Dakota Tax Commissioner — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "OH": {
        "taxPosture": fact(
            "Ohio Commercial Activity Tax (CAT) applies to taxable gross receipts above $3 million (with $150 minimum for most filers). Personal income tax is progressive up to 3.5% (2025).",
            "https://tax.ohio.gov/business/commercial-activity-tax",
            "Ohio Department of Taxation — CAT",
        ),
        "businessRegistration": fact(
            "Register entities through the Ohio Secretary of State Business Services.",
            "https://www.ohiosos.gov/businesses/",
            "Ohio Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports (or statements of continued existence) are due; CAT and municipal taxes follow separate schedules.",
            "https://www.ohiosos.gov/businesses/filing-forms/",
            "Ohio SOS — Business Filings",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Ohio sales tax once economic nexus thresholds are exceeded.",
                "https://tax.ohio.gov/wps/portal/gov/tax/help-center/faqs/sales-and-use-tax",
                "Ohio Department of Taxation — Sales & Use",
            ),
            fact(
                "Ohio employers register for withholding and unemployment compensation.",
                "https://tax.ohio.gov/wps/portal/gov/tax/business/employer-withholding",
                "Ohio Department of Taxation — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "OK": {
        "taxPosture": fact(
            "Oklahoma corporate income tax is 4%. Personal income tax tops out at 4.75% (2025). Franchise tax applies to corporations.",
            "https://oklahoma.gov/tax/businesses/corporate-income-tax.html",
            "Oklahoma Tax Commission",
        ),
        "businessRegistration": fact(
            "Register entities through the Oklahoma Secretary of State Business Filing Department.",
            "https://www.sos.ok.gov/business/",
            "Oklahoma Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual certificates (for LLCs) and franchise tax returns follow SOS and OTC deadlines.",
            "https://www.sos.ok.gov/business/default.aspx",
            "Oklahoma SOS — Business Services",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Oklahoma sales tax once economic nexus thresholds are exceeded.",
                "https://oklahoma.gov/tax/businesses/sales-use-tax.html",
                "Oklahoma Tax Commission — Sales & Use",
            ),
            fact(
                "Oklahoma employers register for withholding and unemployment insurance.",
                "https://oklahoma.gov/tax/businesses/withholding.html",
                "Oklahoma Tax Commission — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "OR": {
        "taxPosture": fact(
            "Oregon has no general sales tax. Corporate excise tax is 6.6% on income up to $1M and 7.6% above; personal income tax is progressive up to 9.9%.",
            "https://www.oregon.gov/dor/programs/businesses/Pages/corporate.aspx",
            "Oregon Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Oregon Secretary of State Corporation Division.",
            "https://sos.oregon.gov/business/Pages/default.aspx",
            "Oregon Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due on the anniversary of formation; corporate excise returns follow DOR deadlines.",
            "https://sos.oregon.gov/business/Pages/annual-report.aspx",
            "Oregon SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Corporate Activity Tax (CAT) may apply to Oregon commercial activity above $1 million.",
                "https://www.oregon.gov/dor/programs/businesses/Pages/corporate-activity-tax.aspx",
                "Oregon DOR — Corporate Activity Tax",
            ),
            fact(
                "Oregon employers register for withholding and unemployment insurance.",
                "https://www.oregon.gov/dor/programs/businesses/Pages/payroll-withholding.aspx",
                "Oregon DOR — Payroll Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "PA": {
        "taxPosture": fact(
            "Pennsylvania corporate net income tax is 7.99% (2025). Personal income tax is a flat 3.07%. Capital stock and foreign franchise taxes have been phased down for many entities.",
            "https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/corporate-net-income-tax.html",
            "Pennsylvania Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Pennsylvania Department of State.",
            "https://www.pa.gov/agencies/dos/programs/business.html",
            "Pennsylvania Department of State",
        ),
        "complianceCalendar": fact(
            "Decennial reports are required every 10 years (plus ongoing annual registration for certain entities); CNI returns follow DOR deadlines.",
            "https://www.pa.gov/agencies/dos/programs/business/reporting-and-fees.html",
            "Pennsylvania DOS — Reporting",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Pennsylvania sales tax once economic nexus thresholds are exceeded.",
                "https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/sales-use-and-hotel-occupancy-tax.html",
                "Pennsylvania DOR — Sales & Use Tax",
            ),
            fact(
                "Pennsylvania employers register for withholding and unemployment compensation.",
                "https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/employer-withholding.html",
                "Pennsylvania DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "RI": {
        "taxPosture": fact(
            "Rhode Island corporate tax rate is 7%. Personal income tax is progressive up to 5.99%. Minimum corporate tax of $400 applies to many entities.",
            "https://tax.ri.gov/tax-sections/corporate-tax",
            "Rhode Island Division of Taxation",
        ),
        "businessRegistration": fact(
            "Register entities through the Rhode Island Secretary of State Business Services.",
            "https://www.sos.ri.gov/divisions/business-services",
            "Rhode Island Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due between Sep 1 and Nov 1 each year; corporate tax returns follow DOR deadlines.",
            "https://www.sos.ri.gov/divisions/business-services/annual-reports",
            "Rhode Island SOS — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Rhode Island sales tax once economic nexus thresholds are exceeded.",
                "https://tax.ri.gov/tax-sections/sales-excise-taxes/sales-use-tax",
                "Rhode Island Division of Taxation — Sales Tax",
            ),
            fact(
                "Rhode Island employers register for withholding and unemployment insurance.",
                "https://tax.ri.gov/tax-sections/withholding-tax",
                "Rhode Island Division of Taxation — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "SC": {
        "taxPosture": fact(
            "South Carolina corporate income tax is 5%. Personal income tax tops out at 6.2% (2025). License fees apply to many entities.",
            "https://dor.sc.gov/tax/corporate",
            "South Carolina Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the South Carolina Secretary of State Business Filings.",
            "https://sos.sc.gov/online-services/business-filings",
            "South Carolina Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the end of the month following the anniversary of formation; corporate returns follow DOR deadlines.",
            "https://sos.sc.gov/online-services/annual-reports",
            "South Carolina SOS — Annual Reports",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect South Carolina sales tax once economic nexus thresholds are exceeded.",
                "https://dor.sc.gov/tax/sales",
                "South Carolina DOR — Sales Tax",
            ),
            fact(
                "South Carolina employers register for withholding and unemployment insurance.",
                "https://dor.sc.gov/tax/withholding",
                "South Carolina DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "SD": {
        "taxPosture": fact(
            "South Dakota has no corporate or personal income tax. Sales tax is 4.5% plus municipal tax. Bank franchise tax applies to financial institutions.",
            "https://dor.sd.gov/businesses/taxes/sales-use-tax/",
            "South Dakota Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the South Dakota Secretary of State Business Services.",
            "https://sdsos.gov/business-services/",
            "South Dakota Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the last day of the anniversary month; sales tax returns follow separate DOR schedules.",
            "https://sdsos.gov/business-services/corporations/annual-report.aspx",
            "South Dakota SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "South Dakota was the landmark Wayfair nexus case — remote sellers must collect sales tax once thresholds are met.",
                "https://dor.sd.gov/businesses/taxes/sales-use-tax/remote-seller/",
                "South Dakota DOR — Remote Seller",
            ),
            fact(
                "Employers with South Dakota workers register for unemployment insurance (no state income tax withholding).",
                "https://dlr.sd.gov/employers/unemployment-tax.aspx",
                "South Dakota DLIR — Unemployment Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "TN": {
        "taxPosture": fact(
            "Tennessee has no tax on wage income. The excise tax (6.5% of net earnings) and franchise tax (0.25% of net worth) apply to most corporations and LLCs.",
            "https://www.tn.gov/revenue/taxes/business-tax/excise-tax.html",
            "Tennessee Department of Revenue — Excise Tax",
        ),
        "businessRegistration": fact(
            "Register entities through the Tennessee Secretary of State Business Services.",
            "https://sos.tn.gov/business-services",
            "Tennessee Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the first day of the fourth month after fiscal year end; excise/franchise returns follow DOR deadlines.",
            "https://sos.tn.gov/business-services/annual-report",
            "Tennessee SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Tennessee sales tax once economic nexus thresholds are exceeded.",
                "https://www.tn.gov/revenue/taxes/sales-and-use-tax.html",
                "Tennessee DOR — Sales & Use Tax",
            ),
            fact(
                "Tennessee employers register for unemployment insurance and franchise/excise accounts as applicable.",
                "https://www.tn.gov/workforce/employers/tax-incentives/unemployment-insurance-tax.html",
                "Tennessee Department of Labor — UI Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "TX": {
        "taxPosture": fact(
            "Texas has no state personal income tax. Most entities owe franchise tax if total revenue exceeds the no-tax-due threshold ($2.47M for 2025 reports); margins tax applies above that.",
            "https://comptroller.texas.gov/taxes/franchise/",
            "Texas Comptroller — Franchise Tax",
        ),
        "businessRegistration": fact(
            "Register corporations, LLCs, and partnerships with the Texas Secretary of State.",
            "https://www.sos.state.tx.us/corp/index.shtml",
            "Texas Secretary of State",
        ),
        "complianceCalendar": fact(
            "Franchise tax reports are due May 15 annually (with extension options); public information reports may accompany zero-tax filings.",
            "https://comptroller.texas.gov/taxes/franchise/forms/",
            "Texas Comptroller — Franchise Tax Forms",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Texas sales tax once economic nexus thresholds are exceeded.",
                "https://comptroller.texas.gov/taxes/sales/faq/remote.php",
                "Texas Comptroller — Remote Sellers",
            ),
            fact(
                "Employers with Texas workers register for unemployment tax; no state income tax withholding.",
                "https://www.twc.texas.gov/businesses/unemployment-tax",
                "Texas Workforce Commission — UI Tax",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "UT": {
        "taxPosture": fact(
            "Utah corporate income tax is 4.55%. Personal income tax is a flat 4.55%. Single-rate structure applies to most taxpayers.",
            "https://tax.utah.gov/business/income",
            "Utah State Tax Commission",
        ),
        "businessRegistration": fact(
            "Register entities through the Utah Division of Corporations and Commercial Code.",
            "https://corporations.utah.gov/",
            "Utah Division of Corporations",
        ),
        "complianceCalendar": fact(
            "Annual renewals are due on the anniversary of registration; corporate returns follow Tax Commission deadlines.",
            "https://corporations.utah.gov/renewals/",
            "Utah Division of Corporations — Renewals",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Utah sales tax once economic nexus thresholds are exceeded.",
                "https://tax.utah.gov/sales",
                "Utah State Tax Commission — Sales Tax",
            ),
            fact(
                "Utah employers register for withholding and unemployment insurance.",
                "https://tax.utah.gov/withholding",
                "Utah State Tax Commission — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "VT": {
        "taxPosture": fact(
            "Vermont corporate income tax tops out at 8.5%. Personal income tax is progressive up to 8.75%. Minimum entity tax may apply.",
            "https://tax.vermont.gov/business/corporate-income-tax",
            "Vermont Department of Taxes",
        ),
        "businessRegistration": fact(
            "Register entities through the Vermont Secretary of State Corporations Division.",
            "https://sos.vermont.gov/corporations/",
            "Vermont Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due within 2.5 months of fiscal year end; corporate returns follow DOR deadlines.",
            "https://sos.vermont.gov/corporations/annual-report/",
            "Vermont SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Vermont sales tax once economic nexus thresholds are exceeded.",
                "https://tax.vermont.gov/business/sales-and-use-tax",
                "Vermont Department of Taxes — Sales & Use",
            ),
            fact(
                "Vermont employers register for withholding and unemployment insurance.",
                "https://tax.vermont.gov/business/withholding-tax",
                "Vermont Department of Taxes — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "VA": {
        "taxPosture": fact(
            "Virginia corporate income tax is 6%. Personal income tax is progressive up to 5.75%. BPOL (business license) taxes may apply locally.",
            "https://www.tax.virginia.gov/corporate-income-tax",
            "Virginia Tax — Corporate Income",
        ),
        "businessRegistration": fact(
            "Register entities through the Virginia State Corporation Commission (SCC).",
            "https://www.scc.virginia.gov/business-home",
            "Virginia State Corporation Commission",
        ),
        "complianceCalendar": fact(
            "Annual registration fees are due by the end of the month following formation anniversary; corporate returns follow Virginia Tax deadlines.",
            "https://www.scc.virginia.gov/businesses/annual-reports/",
            "Virginia SCC — Annual Registration",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Virginia sales tax once economic nexus thresholds are exceeded.",
                "https://www.tax.virginia.gov/sales-and-use-tax",
                "Virginia Tax — Sales & Use",
            ),
            fact(
                "Virginia employers register for withholding and unemployment insurance.",
                "https://www.tax.virginia.gov/withholding-tax",
                "Virginia Tax — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "WA": {
        "taxPosture": fact(
            "Washington has no personal income tax. The Business & Occupation (B&O) tax applies to gross receipts; rates vary by classification. No corporate income tax as traditionally defined.",
            "https://dor.wa.gov/taxes-rates/business-occupation-tax",
            "Washington Department of Revenue — B&O Tax",
        ),
        "businessRegistration": fact(
            "Register entities through the Washington Secretary of State Corporations Division.",
            "https://www.sos.wa.gov/corps/",
            "Washington Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the end of the registration anniversary month; B&O and sales tax returns follow DOR schedules.",
            "https://www.sos.wa.gov/corps/annual-report",
            "Washington SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Washington requires marketplace facilitators and remote sellers to collect sales tax once nexus thresholds are met.",
                "https://dor.wa.gov/taxes-rates/retail-sales-tax/marketplace-fairness",
                "Washington DOR — Marketplace Fairness",
            ),
            fact(
                "Washington employers register for unemployment insurance and workers' comp (no state income tax withholding).",
                "https://esd.wa.gov/employer-taxes",
                "Washington ESD — Employer Taxes",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "WV": {
        "taxPosture": fact(
            "West Virginia corporate income tax is 6.5%. Personal income tax tops out at 5.12% (2025). Business franchise tax has been phased out for most taxpayers.",
            "https://tax.wv.gov/Business/CorporateIncome/Pages/default.aspx",
            "West Virginia State Tax Department",
        ),
        "businessRegistration": fact(
            "Register entities through the West Virginia Secretary of State Business Division.",
            "https://sos.wv.gov/business",
            "West Virginia Secretary of State",
        ),
        "complianceCalendar": fact(
            "Annual reports are due Jul 1 each year; corporate income tax returns follow State Tax Department deadlines.",
            "https://sos.wv.gov/business/Pages/AnnualReport.aspx",
            "West Virginia SOS — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect West Virginia sales tax once economic nexus thresholds are exceeded.",
                "https://tax.wv.gov/Business/SalesAndUse/Pages/default.aspx",
                "West Virginia State Tax Department — Sales & Use",
            ),
            fact(
                "West Virginia employers register for withholding and unemployment compensation.",
                "https://tax.wv.gov/Business/Withholding/Pages/default.aspx",
                "West Virginia State Tax Department — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "WI": {
        "taxPosture": fact(
            "Wisconsin corporate income tax is 7.9%. Personal income tax is progressive up to 7.65%. Economic development surcharge may apply to large corporations.",
            "https://www.revenue.wi.gov/Pages/FAQS/pcs-corp.aspx",
            "Wisconsin Department of Revenue",
        ),
        "businessRegistration": fact(
            "Register entities through the Wisconsin Department of Financial Institutions.",
            "https://www.wdfi.org/corporations/",
            "Wisconsin DFI — Corporations",
        ),
        "complianceCalendar": fact(
            "Annual reports are due by the end of the quarter following the anniversary of formation; corporate returns follow DOR deadlines.",
            "https://www.wdfi.org/corporations/annualreport.htm",
            "Wisconsin DFI — Annual Report",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Remote sellers must collect Wisconsin sales tax once economic nexus thresholds are exceeded.",
                "https://www.revenue.wi.gov/Pages/FAQS/slf-sales-use.aspx",
                "Wisconsin DOR — Sales & Use Tax",
            ),
            fact(
                "Wisconsin employers register for withholding and unemployment insurance.",
                "https://www.revenue.wi.gov/Pages/FAQS/pcs-202.aspx",
                "Wisconsin DOR — Withholding",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
    "WY": {
        "taxPosture": fact(
            "Wyoming has no corporate or personal income tax. Annual report license tax is $60 minimum for many entities (or $60 + assets located in WY for other structures).",
            "https://wyobiz.wyo.gov/Business/AnnualReport.aspx",
            "Wyoming Secretary of State — Annual Report",
        ),
        "businessRegistration": fact(
            "Register entities through Wyoming Business Center (Wyoming Secretary of State).",
            "https://wyobiz.wyo.gov/",
            "Wyoming Business Center",
        ),
        "complianceCalendar": fact(
            "Annual reports are due on the first day of the anniversary month of formation.",
            "https://sos.wyo.gov/Business/AnnualReportRequirements.aspx",
            "Wyoming SOS — Annual Report Requirements",
        ),
        "multiStateHeadsUp": heads_up(
            fact(
                "Incorporating in Wyoming does not eliminate registration requirements in states where you operate.",
                "https://sos.wyo.gov/Business/FAQ.aspx",
                "Wyoming Secretary of State — FAQ",
            ),
            fact(
                "Employers with Wyoming workers register for unemployment insurance (no state income tax withholding).",
                "https://dws.wyo.gov/dws-division/unemployment-insurance/",
                "Wyoming DWS — Unemployment Insurance",
            ),
            SBA_REGISTER,
            IRS_STATE_LINKS,
        ),
    },
}


def main() -> None:
    payload = {
        "version": 1,
        "updatedAt": "2025-06-13",
        "disclaimer": (
            "Founder Snapshot is informational only — not legal, tax, accounting, or compliance advice. "
            "Verify details with official sources and qualified professionals before making decisions."
        ),
        "states": SNAPSHOTS,
    }

    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    OUT_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    OUT_DATA.write_text(text, encoding="utf-8")
    OUT_PUBLIC.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT_DATA} ({len(SNAPSHOTS)} states)")
    print(f"Wrote {OUT_PUBLIC}")


if __name__ == "__main__":
    main()
