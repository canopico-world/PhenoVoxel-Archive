// Selected adult examples, not invariant diagnostic counts or measured shells.
export const abaloneForms={
 'red-abalone':{openPores:4,usualOpenPores:[3,4],height:.45,footColor:'#343a35',source:'https://marine.ucsc.edu/target/haliotis-rufescens/'},
 'european-abalone':{openPores:6,usualOpenPores:[5,7],height:.28,footColor:'#777564',source:'https://www.marlin.ac.uk/species/detail/1692'}
};
export function poreParameter(form,i){return .27+i/Math.max(1,form.openPores-1)*.48;}
