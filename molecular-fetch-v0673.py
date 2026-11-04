"""Retrieve versioned public INSDC/RefSeq records; never generate sequence data."""
import hashlib, json, pathlib, urllib.request, xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).parent
CACHE = ROOT / 'research-cache' / 'mammals-molecular-v0673'
CACHE.mkdir(parents=True, exist_ok=True)

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'PhenoVoxelArchive/0.6.73 evidence-linked educational explorer'}), timeout=45).read()

records = {}
for species, accession, taxid in [('osphranter-rufus', 'KY996501.1', '9321'), ('pan-troglodytes', 'NC_001643.1', '9598')]:
    base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=' + accession
    xml = fetch(base + '&retmode=xml')
    (CACHE / (accession + '.xml')).write_bytes(xml)
    node = ET.fromstring(xml).find('GBSeq')
    assert node is not None
    seq = node.findtext('GBSeq_sequence').upper()
    assert node.findtext('GBSeq_accession-version') == accession
    assert len(seq) == int(node.findtext('GBSeq_length'))
    assert set(seq) <= set('ACGTN')
    features = []
    found_taxid = None
    for ft in node.findall('GBSeq_feature-table/GBFeature'):
        kind = ft.findtext('GBFeature_key')
        quals = {}
        for q in ft.findall('GBFeature_quals/GBQualifier'):
            quals.setdefault(q.findtext('GBQualifier_name'), []).append(q.findtext('GBQualifier_value', ''))
        if kind == 'source':
            found_taxid = next((x.split(':')[1] for x in quals.get('db_xref', []) if x.startswith('taxon:')), None)
        if kind not in ['CDS', 'tRNA', 'rRNA', 'D-loop']: continue
        segments = []
        for it in ft.findall('GBFeature_intervals/GBInterval'):
            start, end = it.findtext('GBInterval_from'), it.findtext('GBInterval_to')
            if start is None or end is None: raise ValueError('Unsupported point feature')
            start, end = int(start), int(end)
            segments.append({'start': min(start, end), 'end': max(start, end), 'strand': -1 if it.find('GBInterval_iscomp') is not None else 1})
        product = quals.get('product', [kind])[0]
        features.append({'id': str(len(features)), 'type': kind, 'name': quals.get('gene', [product])[0], 'product': product,
                         'location': ft.findtext('GBFeature_location'), 'segments': segments,
                         'codonStart': int(quals.get('codon_start', ['1'])[0]), 'translationTable': int(quals.get('transl_table', ['2'])[0]),
                         'proteinId': quals.get('protein_id', [None])[0], 'translation': quals.get('translation', [None])[0],
                         'notes': quals.get('note', []), 'translationExceptions': quals.get('transl_except', [])})
    assert found_taxid == taxid, (found_taxid, taxid)
    gb = fetch(base + '&rettype=gbwithparts&retmode=text')
    gb_name = 'molecular-' + accession.replace('.', '-') + '-v0673.gb'
    (ROOT / gb_name).write_bytes(gb)
    fasta = '>' + accession + ' ' + node.findtext('GBSeq_definition') + '\n' + '\n'.join(seq[i:i+70] for i in range(0, len(seq), 70)) + '\n'
    fasta_name = 'molecular-' + accession.replace('.', '-') + '-v0673.fasta'
    (ROOT / fasta_name).write_text(fasta, encoding='utf-8', newline='\n')
    record = {'speciesId': species, 'accession': accession, 'taxonId': int(taxid), 'organism': node.findtext('GBSeq_organism'),
              'definition': node.findtext('GBSeq_definition'), 'length': len(seq), 'topology': node.findtext('GBSeq_topology'),
              'molecule': 'mitochondrial DNA', 'sequence': seq, 'sequenceSha256': hashlib.sha256(seq.encode()).hexdigest(),
              'features': features, 'retrieved': '2026-11-04', 'recordUpdated': node.findtext('GBSeq_update-date'),
              'sourceUrl': 'https://www.ncbi.nlm.nih.gov/nuccore/' + accession,
              'rawGenbank': gb_name, 'fasta': fasta_name, 'rawSha256': hashlib.sha256(gb).hexdigest(),
              'scope': 'One published mitochondrial sequence record; not a whole nuclear genome or the genotype of the rendered animal.'}
    records[species] = record
    print(species, accession, len(seq), 'CDS', sum(f['type']=='CDS' for f in features), 'all features', len(features), 'N', seq.count('N'), record['sequenceSha256'])

payload = {'version': '0.6.73', 'coordinateConvention': '1-based inclusive coordinates on the deposited forward strand; complement strand is antiparallel.',
           'source': 'NCBI Nucleotide / INSDC and RefSeq', 'records': records,
           'limits': 'Idealized local B-DNA illustration, not atomistic geometry, sequencing instrumentation, chromatin or a DNA-to-phenotype simulation.'}
(ROOT / 'molecular-data-v0673.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
