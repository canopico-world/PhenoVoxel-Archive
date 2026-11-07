"""Fetch deposited DNA with exact NCBI species identity; resumable, <=2 requests/s."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, threading, time
import urllib.parse, urllib.request, xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).parent
CACHE=ROOT/'research-cache'/'molecular-v0683'
CACHE.mkdir(parents=True,exist_ok=True)
LOCK=threading.Lock(); LAST=0
TODAY=datetime.date.today().isoformat()
BASE='https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
REVIEWED_NAMES={'Borrelia burgdorferi':{'name':'Borreliella burgdorferi','source':'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=139&mode=Info','note':'NCBI taxon 139 lists Borrelia burgdorferi Johnson et al. 1984 as the basionym of Borreliella burgdorferi.'}}
def fetch(endpoint,**params):
    global LAST
    params['tool']='PhenoVoxelArchive'
    url=BASE+endpoint+'.fcgi?'+urllib.parse.urlencode(params)
    key=hashlib.sha256(url.encode()).hexdigest()
    p=CACHE/(key+'.response')
    if p.exists(): return p.read_bytes()
    for attempt in range(4):
        with LOCK:
            time.sleep(max(0,.52-(time.monotonic()-LAST)))
            LAST=time.monotonic()
        try:
            b=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'PhenoVoxelArchive/0.6.83 educational sequence explorer'}),timeout=50).read()
            if b.startswith(b'{') and json.loads(b).get('error'): raise ValueError(b[:150])
            p.write_bytes(b); return b
        except Exception:
            if attempt==3: raise
            time.sleep(2**attempt)
def search(db,term,n=8):
    data=json.loads(fetch('esearch',db=db,term=term,retmode='json',retmax=n))
    return data['esearchresult']['idlist']
def norm(s):return re.sub(r'\s+',' ',s.strip().lower())
def taxon(tid):
    x=ET.fromstring(fetch('efetch',db='taxonomy',id=tid,retmode='xml')).find('Taxon')
    if x is None: raise ValueError('Missing taxonomy '+str(tid))
    return x
def resolve(name):
    name=REVIEWED_NAMES.get(name,{}).get('name',name)
    ids=list(dict.fromkeys(search('taxonomy','"'+name+'"[Scientific Name]',5)+search('taxonomy','"'+name+'"[All Names]',8)))
    matches=[]
    for tid in ids:
        node=taxon(tid)
        names=[node.findtext('ScientificName','')]+[e.text or '' for e in node.findall('OtherNames/*')]+[e.findtext('DispName','') for e in node.findall('OtherNames/Name') if e.findtext('ClassCDE')!='authority']
        if norm(name) in map(norm,names) and node.findtext('Rank')=='species':matches.append((tid,node))
    if len(matches)!=1:raise ValueError('No unique exact species/synonym taxonomy match: '+name)
    return matches[0]
def lineage_matches(source_tid,expected):
    if source_tid==expected:return True
    return any(e.findtext('TaxId')==expected and e.findtext('Rank')=='species' for e in taxon(source_tid).findall('LineageEx/Taxon'))
def quals(ft):
    q={}
    for e in ft.findall('GBFeature_quals/GBQualifier'):q.setdefault(e.findtext('GBQualifier_name'),[]).append(e.findtext('GBQualifier_value',''))
    return q
def parse(node,species,tid,tax,query):
    seq=node.findtext('GBSeq_sequence','').upper(); accession=node.findtext('GBSeq_accession-version','')
    if not seq or len(seq)!=int(node.findtext('GBSeq_length','0')) or not 200<=len(seq)<=35000:raise ValueError('Missing or out-of-budget DNA')
    if set(seq)-set('ACGTRYSWKMBDHVN'):raise ValueError('Unsupported sequence alphabet')
    if 'DNA' not in node.findtext('GBSeq_moltype','').upper():raise ValueError('Record is not DNA')
    source=node.find("GBSeq_feature-table/GBFeature[GBFeature_key='source']")
    sq=quals(source) if source is not None else {}
    source_tid=next((x.split(':')[1] for x in sq.get('db_xref',[]) if x.startswith('taxon:')),None)
    if not source_tid or not lineage_matches(source_tid,tid):raise ValueError('Source species identity mismatch')
    definition=node.findtext('GBSeq_definition','')
    if re.search(r'UNVERIFIED|UNCONFIRMED|synthetic construct|environmental sample',definition,re.I):raise ValueError('Unverified/environmental source')
    features=[]; skipped=[]
    for ft in node.findall('GBSeq_feature-table/GBFeature'):
        kind=ft.findtext('GBFeature_key');q=quals(ft)
        if kind not in ['CDS','tRNA','rRNA','D-loop','misc_RNA','ncRNA','misc_feature','repeat_region']:continue
        segments=[]; invalid=False
        for it in ft.findall('GBFeature_intervals/GBInterval'):
            a=it.findtext('GBInterval_from',it.findtext('GBInterval_point'));b=it.findtext('GBInterval_to',a)
            ref=it.findtext('GBInterval_accession','')
            if a is None or b is None or (ref and ref.split('.')[0]!=accession.split('.')[0]):invalid=True;break
            a,b=int(a),int(b)
            if min(a,b)<1 or max(a,b)>len(seq):invalid=True;break
            comp=it.find('GBInterval_iscomp')
            segments.append({'start':min(a,b),'end':max(a,b),'strand':-1 if comp is not None and comp.get('value','true')!='false' else 1})
        if invalid or not segments:skipped.append({'type':kind,'location':ft.findtext('GBFeature_location'),'reason':'Remote or unsupported coordinates; retained in source XML'});continue
        location=ft.findtext('GBFeature_location','');product=q.get('product',q.get('note',[kind]))[0]
        pseudo='pseudo' in q or 'pseudogene' in q
        reason='; '.join(x for x in ['partial/uncertain CDS boundary' if re.search(r'[<>?]',location) else '', 'pseudogene annotation' if pseudo else '', 'deposited translation exception' if q.get('transl_except') or q.get('exception') else ''] if x)
        features.append({'id':str(len(features)),'type':kind,'name':q.get('gene',[product])[0],'product':product,'location':location,'segments':segments,'codonStart':int(q.get('codon_start',['1'])[0]),'translationTable':int(q.get('transl_table',['1'])[0]),'proteinId':q.get('protein_id',[None])[0],'translation':q.get('translation',[None])[0],'notes':q.get('note',[]),'translationExceptions':q.get('transl_except',[])+q.get('exception',[]),'translationRestriction':reason})
    if not features:features=[{'id':'0','type':'source','name':'Deposited DNA interval','product':'No gene boundaries are supplied in this record','location':'1..'+str(len(seq)),'segments':[{'start':1,'end':len(seq),'strand':1}],'codonStart':1,'translationTable':1,'proteinId':None,'translation':None,'notes':['Whole deposited interval, not an inferred gene annotation.'],'translationExceptions':[]}]
    organelle=sq.get('organelle',[''])[0]
    molecule=('mitochondrial DNA' if 'mitochond' in organelle else 'chloroplast DNA' if 'chloroplast' in organelle or 'plastid' in organelle else 'genomic DNA')
    complete=bool(re.search(r'complete genome|complete mitochondrial genome|mitochondrion, complete',definition,re.I))
    raw=ET.tostring(node,encoding='unicode')
    return {'speciesId':species['id'],'commonName':species['commonName'],'accession':accession,'taxonId':int(tid),'sourceTaxonId':int(source_tid),'taxonName':tax.findtext('ScientificName'),'taxonMatch':'exact species' if tid==source_tid else 'record taxon is within the verified species lineage','archiveScientificName':species['scientificName'],'organism':node.findtext('GBSeq_organism'),'definition':definition,'length':len(seq),'topology':node.findtext('GBSeq_topology','linear'),'molecule':molecule,'organelle':organelle,'completeness':'complete' if complete else 'partial','sequence':seq,'sequenceSha256':hashlib.sha256(seq.encode()).hexdigest(),'features':features,'omittedFeatures':skipped,'retrieved':TODAY,'recordUpdated':node.findtext('GBSeq_update-date'),'sourceUrl':'https://www.ncbi.nlm.nih.gov/nuccore/'+accession,'database':'RefSeq' if accession.startswith(('NC_','NR_','NG_','NT_')) else 'INSDC GenBank','sourceXml':raw,'sourceXmlSha256':hashlib.sha256(raw.encode()).hexdigest(),'selectionQuery':query,'scope':'One deposited '+molecule+' record. '+('Complete organellar record; not a nuclear genome. ' if complete and organelle else 'A limited DNA interval, not a complete species genome. ' if not complete else '')+'Its specimen, strain, and genotype are separate from the rendered organism. Annotation quality and population representativeness have not been independently validated.'}
def work(s,refresh=False):
    p=CACHE/(s['id']+'.json')
    if p.exists() and not refresh:return json.loads(p.read_text(encoding='utf-8'))
    result={'id':s['id'],'scientificName':s['scientificName'],'commonName':s['commonName'],'group':s['group'],'status':'unavailable','checked':TODAY}
    try:
        tid,tax=resolve(s['scientificName']);result.update(taxonId=int(tid),taxonName=tax.findtext('ScientificName'))
        organism='txid'+tid+'[Organism:exp]'
        common=organism+' AND 200:35000[SLEN] NOT ("unverified"[Title] OR "unconfirmed"[Title] OR "environmental sample"[Title] OR "synthetic construct"[Title])'
        if s['group']=='Animalia':terms=['mitochondrion[Filter] AND "complete genome"[Title] AND refseq[Filter]','mitochondrion[Filter] AND "complete genome"[Title]','COI[Gene Name] OR COX1[Gene Name] OR "cytochrome oxidase subunit I"[Title]','mitochondrion[Filter]','']
        elif s['group']=='Plantae':terms=['rbcL[Gene Name] AND 400:3000[SLEN]','matK[Gene Name] AND 400:3000[SLEN]','"internal transcribed spacer"[Title] AND 300:5000[SLEN]','']
        elif s['group']=='Fungi':terms=['"internal transcribed spacer"[Title] AND 300:5000[SLEN]','"ribosomal RNA"[Title] AND 300:5000[SLEN]','']
        elif s['group'] in ['Bacteria','Archaea']:terms=['"16S ribosomal RNA"[Title] AND 800:3000[SLEN]','"16S"[Title] AND 500:5000[SLEN]','']
        else:terms=['"18S ribosomal RNA"[Title] AND 500:6000[SLEN]','"small subunit"[Title] AND 500:6000[SLEN]','rbcL[Gene Name] AND 400:3000[SLEN]','']
        errors=[];tried=set()
        for term in terms:
            query=common+(' AND ('+term+')' if term else '')
            ids=[i for i in search('nuccore',query,6) if i not in tried];tried.update(ids)
            if not ids:continue
            nodes=ET.fromstring(fetch('efetch',db='nuccore',id=','.join(ids),retmode='xml')).findall('GBSeq')
            # Prefer versioned reference records, then fewer ambiguous bases and longer DNA.
            nodes.sort(key=lambda n:(not n.findtext('GBSeq_accession-version','').startswith(('NC_','NR_')),sum(c not in 'acgt' for c in n.findtext('GBSeq_sequence','')), -int(n.findtext('GBSeq_length','0'))))
            for node in nodes:
                try:
                    record=parse(node,s,tid,tax,query)
                    if s['scientificName'] in REVIEWED_NAMES:record['taxonomyNameEvidence']=REVIEWED_NAMES[s['scientificName']];record['taxonMatch']+='; documented historical name mapped to the same species'
                    result.update(status='verified',record=record);break
                except Exception as e:errors.append(str(e))
            if result['status']=='verified':break
        if result['status']!='verified':result['reason']='No suitable verified DNA record found within the reviewed search and size scope.';result['reviewDetails']=errors[-8:]
    except Exception as e:result['reason']=str(e)
    p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(s['id'],result['status'],result.get('record',{}).get('accession',result.get('reason','')),flush=True)
    return result
if __name__=='__main__':
    db=json.loads((ROOT/'species.json').read_text(encoding='utf-8-sig'))
    existing={k for v in ['0673','0674','0675'] for k in json.loads((ROOT/('molecular-data-v'+v+'.json')).read_text(encoding='utf-8-sig'))['records']}
    missing=[s for s in db['species'] if s['id'] not in existing]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(work,missing))
    (CACHE/'audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print('COMPLETE',len(results),'VERIFIED',sum(r['status']=='verified' for r in results),flush=True)
