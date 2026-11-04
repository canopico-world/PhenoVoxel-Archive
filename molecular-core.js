// All positions are 1-based and inclusive, in deposited-record coordinates.
export const complement = base => ({A:'T',T:'A',C:'G',G:'C',N:'N'})[base] || 'N';
export const reverseComplement = sequence => [...sequence].reverse().map(complement).join('');
export function sequenceWindow(record, start, size = 42, reverse = false) {
  start = Math.max(1, Math.min(record.length - size + 1, Math.trunc(start) || 1));
  const positions = Array.from({length: Math.min(size, record.length)}, (_,i)=>start+i);
  if(reverse) positions.reverse();
  return positions.map(position=>({position, base:reverse?complement(record.sequence[position-1]):record.sequence[position-1]}));
}
export function featurePositions(feature) {
  return feature.segments.flatMap(s=>Array.from({length:Math.abs(s.end-s.start)+1},(_,i)=>s.strand<0?s.end-i:s.start+i));
}
export function featureSequence(record, feature, changes = new Map()) {
  return feature.segments.map(s=>{
    const raw = Array.from({length:s.end-s.start+1},(_,i)=>changes.get(s.start+i)||record.sequence[s.start+i-1]).join('');
    return s.strand<0?reverseComplement(raw):raw;
  }).join('').slice(feature.codonStart-1);
}
const alphabet = 'TCAG', amino = 'FFLLSSSSYY**CCWWLLLLPPPPHHQQRRRRIIMMTTTTNNKKSS**VVVVAAAADDEEGGGG';
const table2 = new Map(); let n=0;
for(const a of alphabet)for(const b of alphabet)for(const c of alphabet)table2.set(a+b+c,amino[n++]);
export function translateMito(sequence, initiator = true) {
  let protein = '';
  for(let i=0;i+2<sequence.length;i+=3){const c=sequence.slice(i,i+3);protein+=i===0&&initiator&&['ATT','ATC','ATA','ATG','GTG'].includes(c)?'M':table2.get(c)||'X';}
  return protein;
}
export function codonAt(record, feature, position, changes = new Map()) {
  if(feature.type!=='CDS')return null;
  const positions=featurePositions(feature).slice(feature.codonStart-1), index=positions.indexOf(position);
  if(index<0)return null;
  const start=Math.floor(index/3)*3, sequence=featureSequence(record,feature,changes), codon=sequence.slice(start,start+3);
  return {codon, index:Math.floor(index/3)+1, positions:positions.slice(start,start+3), amino:codon.length===3?translateMito(codon,start===0):null, partial:codon.length<3};
}
export function findMotifs(sequence, motif, {circular=false} = {}) {
  motif=motif.toUpperCase().replace(/\s/g,'');
  if(!/^[ACGT]{2,60}$/.test(motif))throw new Error('Enter 2–60 A, C, G or T bases.');
  const reverse=reverseComplement(motif), results=[],search=circular?sequence+sequence.slice(0,motif.length-1):sequence;
  if(motif.length>sequence.length)return results;
  for(let i=0;i<(circular?sequence.length:sequence.length-motif.length+1);i++){
    const part=search.slice(i,i+motif.length),wrap=i+motif.length>sequence.length?{wrapsOrigin:true}:{};
    if(part===motif)results.push({position:i+1,strand:'+',...wrap});
    if(reverse!==motif&&part===reverse)results.push({position:i+1,strand:'−',...wrap});
  }
  return results;
}
export function toFasta(record, changes = new Map()) {
  const hypothetical=changes.size>0, seq=[...record.sequence].map((b,i)=>changes.get(i+1)||b).join('');
  return `>${hypothetical?'HYPOTHETICAL_SANDBOX derived_from=':''}${record.accession} ${record.organism} mitochondrial DNA${hypothetical?' substitutions='+[...changes].map(([p,b])=>record.sequence[p-1]+p+b).join(','):''}\n${seq.match(/.{1,70}/g).join('\n')}\n`;
}
