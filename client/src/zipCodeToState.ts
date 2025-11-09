/**
 * Maps US zip codes to state abbreviations
 * Based on USPS zip code ranges (first 3 digits)
 */

export const zipCodeToState = (zipCode: string): string => {
  // Remove any non-numeric characters
  const cleaned = zipCode.replace(/\D/g, '');
  if (cleaned.length < 3) {
    return "NJ"; // Default fallback
  }

  const prefix = parseInt(cleaned.substring(0, 3), 10);

  // Territories (check first to avoid conflicts)
  if (prefix >= 6 && prefix <= 9) return "PR"; // Puerto Rico (006-009)

  // New England states (check first to avoid conflicts)
  if (prefix >= 10 && prefix <= 27) return "MA"; // Massachusetts
  if (prefix >= 28 && prefix <= 29) return "RI"; // Rhode Island
  if (prefix >= 30 && prefix <= 39) return "NH"; // New Hampshire
  if (prefix >= 39 && prefix <= 49) return "ME"; // Maine (overlaps with NH)
  if (prefix >= 50 && prefix <= 59) return "VT"; // Vermont
  if (prefix === 55) return "MA"; // Massachusetts (specific)
  if (prefix >= 60 && prefix <= 69) return "CT"; // Connecticut
  if (prefix >= 70 && prefix <= 89) return "NJ"; // New Jersey
  
  // Mid-Atlantic and South
  if (prefix >= 100 && prefix <= 149) return "NY"; // New York
  if (prefix >= 150 && prefix <= 199) {
    if (prefix >= 197 && prefix <= 199) return "DE"; // Delaware
    return "PA"; // Pennsylvania
  }
  if (prefix >= 200 && prefix <= 205) return "DC"; // Washington DC
  if (prefix >= 206 && prefix <= 219) return "MD"; // Maryland
  if (prefix >= 220 && prefix <= 246) return "VA"; // Virginia
  if (prefix >= 247 && prefix <= 269) return "WV"; // West Virginia
  if (prefix >= 270 && prefix <= 289) return "NC"; // North Carolina
  if (prefix >= 290 && prefix <= 299) return "SC"; // South Carolina
  if (prefix >= 300 && prefix <= 319) return "GA"; // Georgia
  if (prefix >= 320 && prefix <= 349) return "FL"; // Florida
  
  // South Central
  if (prefix >= 350 && prefix <= 369) return "AL"; // Alabama
  if (prefix >= 370 && prefix <= 389) return "TN"; // Tennessee
  if (prefix >= 390 && prefix <= 399) return "MS"; // Mississippi
  
  // Midwest
  if (prefix >= 400 && prefix <= 429) return "KY"; // Kentucky
  if (prefix >= 430 && prefix <= 459) return "OH"; // Ohio
  if (prefix >= 460 && prefix <= 479) return "IN"; // Indiana
  if (prefix >= 480 && prefix <= 499) return "MI"; // Michigan
  if (prefix >= 500 && prefix <= 529) return "IA"; // Iowa
  if (prefix >= 530 && prefix <= 549) return "WI"; // Wisconsin
  if (prefix >= 550 && prefix <= 569) return "MN"; // Minnesota
  if (prefix >= 570 && prefix <= 579) return "SD"; // South Dakota
  if (prefix >= 580 && prefix <= 589) return "ND"; // North Dakota
  if (prefix >= 590 && prefix <= 599) return "MT"; // Montana
  if (prefix >= 600 && prefix <= 629) return "IL"; // Illinois
  if (prefix >= 630 && prefix <= 659) return "MO"; // Missouri
  if (prefix >= 660 && prefix <= 679) return "KS"; // Kansas
  if (prefix >= 680 && prefix <= 699) return "NE"; // Nebraska
  
  // South Central / Gulf
  if (prefix >= 700 && prefix <= 715) return "LA"; // Louisiana
  if (prefix >= 716 && prefix <= 729) return "AR"; // Arkansas
  if (prefix >= 730 && prefix <= 749) return "OK"; // Oklahoma
  if (prefix >= 750 && prefix <= 799) return "TX"; // Texas
  
  // Mountain West
  if (prefix >= 800 && prefix <= 819) return "CO"; // Colorado
  if (prefix >= 820 && prefix <= 831) return "WY"; // Wyoming
  if (prefix >= 832 && prefix <= 839) return "ID"; // Idaho
  if (prefix >= 840 && prefix <= 849) return "UT"; // Utah
  if (prefix >= 850 && prefix <= 869) return "AZ"; // Arizona
  if (prefix >= 870 && prefix <= 889) return "NM"; // New Mexico
  if (prefix >= 890 && prefix <= 899) return "NV"; // Nevada
  
  // West Coast
  if (prefix >= 900 && prefix <= 966) return "CA"; // California
  if (prefix >= 967 && prefix <= 968) return "HI"; // Hawaii
  if (prefix >= 969 && prefix <= 969) return "CA"; // California (continued)
  if (prefix >= 970 && prefix <= 979) return "OR"; // Oregon
  if (prefix >= 980 && prefix <= 994) return "WA"; // Washington
  if (prefix >= 995 && prefix <= 999) return "AK"; // Alaska

  // Default fallback
  return "NJ";
};

