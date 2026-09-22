// Country (ISO alpha-2) -> currency (ISO 4217), for the African markets this
// platform plausibly serves. Falls back to USD for anything else so
// registration never fails on an unmapped country.
final map<string> countryCurrency = {
    "KE": "KES",
    "NG": "NGN",
    "GH": "GHS",
    "ZA": "ZAR",
    "UG": "UGX",
    "TZ": "TZS",
    "RW": "RWF",
    "EG": "EGP"
};

function currencyForCountry(string country) returns string {
    string code = country.trim().toUpperAscii();
    string? currency = countryCurrency[code];
    if currency is string {
        return currency;
    }
    return "USD";
}
