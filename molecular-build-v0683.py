"""Package verified records in small, lazy-loaded chunks; keep every existing species unchanged."""
import collections,hashlib,html,json,pathlib
R=pathlib.Path(__file__).parent;C=R/'research-cache'/'molecular-v0683'
codes=json.loads((R/'molecular-codes-v0683.json').read_text())['tables']
complement=str.maketrans('ACGTRYSWKMBDHVN','TGCAYRSWMKVHDBN')
def verify_translation(r):
    for f in r['features']:
        if f['type']!='CDS':continue
        code=codes.get(str(f['translationTable']))
        if f.get('translationRestriction'):f['translationCheck']='restricted by source annotation';continue
        if not code or code['contextDependent']:f['translationRestriction']='Unsupported or context-dependent code';f['translationCheck']='withheld';continue
        if not f['translation']:f['translationRestriction']='No deposited protein available for comparison';f['translationCheck']='withheld';continue
        fragments=[]
        for seg in f['segments']:
            part=r['sequence'][seg['start']-1:seg['end']]
            fragments.append(part.translate(complement)[::-1] if seg['strand']<0 else part)
        seq=''.join(fragments)[f['codonStart']-1:];protein=''
        for i in range(0,len(seq)-2,3):
            c=seq[i:i+3]
            if any(x not in 'TCAG' for x in c):protein+='X';continue
            k='TCAG'.index(c[0])*16+'TCAG'.index(c[1])*4+'TCAG'.index(c[2]);protein+='M' if i==0 and code['starts'][k]=='M' else code['amino'][k]
        protein=protein[:-1] if protein.endswith('*') else protein
        if protein==f['translation']:f['translationCheck']='matches deposited protein'
        else:f['translationCheck']='does not reproduce deposited protein';f['translationRestriction']='Direct code-table translation differs from the deposited protein; RNA processing, annotation, or sequence uncertainty requires review'
db=json.loads((R/'species.json').read_text(encoding='utf-8-sig'))
old={}
for v in ['0673','0674','0675']:
    for key,r in json.loads((R/f'molecular-data-v{v}.json').read_text(encoding='utf-8-sig'))['records'].items():old[key]=(r,f'molecular-data-v{v}.json')
entries={};new=[]
for s in db['species']:
    sid=s['id'];entry={k:s[k] for k in ['id','scientificName','commonName','group']}
    if sid in old:
        rec,file=old[sid];entry.update(status='verified',legacy=True,dataFile=file)
    else:
        p=C/(sid+'.json');result=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {'status':'checking','reason':'Source audit in progress.'}
        entry.update({k:v for k,v in result.items() if k!='record'})
        if result['status']=='verified':rec=result['record'];verify_translation(rec);new.append(rec)
        else:rec=None
    if rec:
        entry.update(accession=rec['accession'],taxonId=rec['taxonId'],organism=rec['organism'],length=rec['length'],molecule=rec['molecule'],completeness=rec.get('completeness','complete'),sourceUrl=rec['sourceUrl'],sequenceSha256=rec['sequenceSha256'],retrieved=rec['retrieved'])
    entries[sid]=entry
chunks=[];chunk={};size=0
for r in new:
    n=len(json.dumps(r,ensure_ascii=False).encode())
    if size+n>1800000 and chunk:chunks.append(chunk);chunk={};size=0
    chunk[r['speciesId']]=r;size+=n
if chunk:chunks.append(chunk)
for i,records in enumerate(chunks,1):
    filename=f'molecular-records-v0683-{i:02}.json'
    raw=json.dumps({'version':'0.6.83','records':records},ensure_ascii=False,separators=(',',':'))+'\n'
    (R/filename).write_text(raw,encoding='utf-8',newline='\n')
    for sid in records:entries[sid]['dataFile']=filename
counts=dict(collections.Counter(e['status'] for e in entries.values()))
index={'version':'0.6.83','checked':'2026-11-07','speciesCount':len(entries),'previousSequenceCount':len(old),'counts':counts,'records':entries,'selectionPolicy':'Match the NCBI species name or documented synonym; source taxon must be that species or a verified descendant. Prefer complete mitochondrial RefSeq records for animals, plastid markers for plants, ribosomal DNA for fungi and microbes. Only deposited DNA intervals of 200–35,000 bp are bundled. This is not a claim to supply complete nuclear genomes or all available sequences.','source':'https://www.ncbi.nlm.nih.gov/nuccore/'}
(R/'molecular-index-v0683.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
esc=lambda x:html.escape(str(x),quote=True)
rows=''.join(f'<tr data-search="{esc((e["commonName"]+" "+e["scientificName"]+" "+e["group"]+" "+e["status"]).lower())}"><td><a href="molecular-lab-v0683.html#{e["id"]}">{esc(e["commonName"])}</a><br><i>{esc(e["scientificName"])}</i></td><td>{esc(e["group"])}</td><td>{esc(e["status"])}</td><td>'+ (f'<a href="{e["sourceUrl"]}">{e["accession"]}</a><br>{e["length"]:,} bp · {esc(e["molecule"])}<br>{esc(e["completeness"])} record' if e['status']=='verified' else esc(e.get('reason','Source review pending')))+'</td></tr>' for e in entries.values())
report=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DNA coverage · PhenoVoxel</title><style>body{{background:#07171d;color:#dceae4;font:16px/1.6 system-ui;margin:0}}main{{max-width:1100px;margin:auto;padding:40px 24px}}a{{color:#a7dfcc}}h1{{font:48px Georgia,serif}}.counts{{font-size:24px;color:#d4e5b1}}input{{background:#102b34;border:1px solid #47646b;color:inherit;padding:14px;width:min(90%,600px);margin:20px 0}}table{{border-collapse:collapse;width:100%}}th,td{{text-align:left;padding:16px 10px;border-bottom:1px solid #294047;vertical-align:top}}i,small{{color:#98b5bd}}.table{{overflow:auto}}.note{{border:1px solid #385256;padding:20px;border-radius:12px}}[hidden]{{display:none}}</style><main><a href="./">← PhenoVoxel Archive</a><p>MOLECULAR COVERAGE · v0.6.83 · 7 November 2026</p><h1>Every species, an evidence trail.</h1><p class="counts">{len(entries)} study pages · {counts.get('verified',0)} verified DNA records · {counts.get('unavailable',0)} unavailable after this audit</p><p>Added {counts.get('verified',0)-len(old)} deposited DNA records to the previous {len(old)} studies. Every archive species now has a molecular-study entry, including an explicit source status when verified DNA could not be loaded.</p><div class="note"><strong>What you can study</strong><p>Rotate the local DNA schematic, select A/C/G/T or ambiguous bases, search both strands, inspect source gene annotations and preview clearly labelled hypothetical substitutions. Translation follows each CDS’s deposited genetic code. Uncertain or context-dependent translations are withheld. Download reference FASTA and source annotation evidence.</p><p>{esc(index['selectionPolicy'])}</p><p>The sequence is not the genotype of the photographed or rendered individual. The helix is a diagram, not molecular dynamics. This release does not perform sequencing, read alignment, variant calling, or validated prediction of traits or disease.</p></div><p><a href="molecular-lab-v0683.html">Open the molecular observatory →</a> · <a href="molecular-index-v0683.json">Download the complete coverage audit</a></p><label>Find a species or group<br><input id="filter" placeholder="Scientific name, common name, group or status" type="search"></label><p id="count">{len(entries)} entries</p><div class="table"><table><thead><tr><th>Species</th><th>Group</th><th>Status</th><th>Evidence and scope</th></tr></thead><tbody>{rows}</tbody></table></div><p>Primary sources: <a href="https://www.ncbi.nlm.nih.gov/nuccore/">NCBI Nucleotide</a>, <a href="https://www.ncbi.nlm.nih.gov/taxonomy">NCBI Taxonomy</a>, <a href="https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi">NCBI genetic codes</a>. Public sequence records retain their source annotations and <a href="https://www.ncbi.nlm.nih.gov/home/about/policies/">NCBI data policies</a>.</p><script>document.querySelector('#filter').addEventListener('input',e=>{{let n=0;for(const row of document.querySelectorAll('tbody tr')){{row.hidden=!row.dataset.search.includes(e.target.value.toLowerCase().trim());if(!row.hidden)n++}}document.querySelector('#count').textContent=n+' entries'}})</script></main></html>'''
(R/'molecular-coverage-v0683.html').write_text(report,encoding='utf-8',newline='\n')
print('PACKAGED',counts,'chunks',len(chunks),flush=True)
