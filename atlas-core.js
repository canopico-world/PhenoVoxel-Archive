export const countryCode=f=>[f.properties.ISO_A2_EH,f.properties.ISO_A2].find(x=>/^[A-Z]{2}$/.test(x))||'';
export function occurrenceQuery(s,year='',country=''){
 const p=new URLSearchParams({taxonKey:String(s.taxonomy.acceptedUsageKey||s.taxonomy.usageKey),hasCoordinate:'true',hasGeospatialIssue:'false'});
 if(year)p.set('year',year);if(country)p.set('country',country);return p;
}
