"""Retrieve versioned public INSDC/RefSeq records; never generate sequence data."""
import hashlib, json, pathlib, urllib.request, xml.etree.ElementTree as ET, sys, time

ROOT = pathlib.Path(__file__).parent
CACHE = ROOT / 'research-cache' / 'cetaceans-sixteen-v0675'
CACHE.mkdir(parents=True, exist_ok=True)

def fetch(url):
    time.sleep(.4)
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'PhenoVoxelArchive/0.6.75 evidence-linked educational explorer'}), timeout=45).read()

records = {}
for species, accession, taxid in [('caperea-marginata', 'NC_005269.1', '27604'), ('balaenoptera-borealis', 'NC_006929.1', '9768'), ('balaenoptera-acutorostrata', 'NC_005271.1', '9767'), ('balaenoptera-bonaerensis', 'NC_006926.1', '33556'), ('balaenoptera-ricei', 'PQ997938.1', '2746895'), ('balaenoptera-edeni', 'NC_007938.1', '9769'), ('balaenoptera-omurai', 'NC_007937.1', '255217'), ('globicephala-melas', 'NC_083222.1', '9731'), ('grampus-griseus', 'NC_012062.1', '83653'), ('inia-geoffrensis', 'NC_005276.1', '9725'), ('stenella-longirostris', 'NC_032301.1', '9736'), ('stenella-coeruleoalba', 'NC_012053.1', '9737'), ('orcaella-brevirostris', 'NC_019590.1', '48747'), ('hyperoodon-ampullatus', 'NC_005273.1', '48744'), ('mesoplodon-densirostris', 'NC_021974.2', '48708'), ('kogia-sima', 'NC_041303.1', '9752')]:
    base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=' + accession
    xml = (CACHE / (accession + '.xml')).read_bytes() if (CACHE / (accession + '.xml')).exists() else fetch(base + '&retmode=xml')
    (CACHE / (accession + '.xml')).write_bytes(xml)
    node = ET.fromstring(xml).find('GBSeq')
    assert node is not None
    seq = node.findtext('GBSeq_sequence').upper()
    assert node.findtext('GBSeq_accession-version') == accession
    assert len(seq) == int(node.findtext('GBSeq_length'))
    assert set(seq) <= set('ACGTRYSWKMBDHVN')
    features = []
    found_taxid = None
    for ft in node.findall('GBSeq_feature-table/GBFeature'):
        kind = ft.findtext('GBFeature_key')
        quals = {}
        for q in ft.findall('GBFeature_quals/GBQualifier'):
            quals.setdefault(q.findtext('GBQualifier_name'), []).append(q.findtext('GBQualifier_value', ''))
        if kind == 'source':
            found_taxid = next((x.split(':')[1] for x in quals.get('db_xref', []) if x.startswith('taxon:')), None)
        if kind not in ['CDS', 'tRNA', 'rRNA', 'D-loop', 'misc_feature']: continue
        segments = []
        for it in ft.findall('GBFeature_intervals/GBInterval'):
            start, end = it.findtext('GBInterval_from'), it.findtext('GBInterval_to')
            if start is None or end is None: raise ValueError('Unsupported point feature')
            start, end = int(start), int(end)
            segments.append({'start': min(start, end), 'end': max(start, end), 'strand': -1 if it.find('GBInterval_iscomp') is not None else 1})
        product = quals.get('product', quals.get('note', [kind]))[0]
        if kind == 'misc_feature' and accession == 'DQ283423.1':
            quals['gene'] = ['12S–tRNA-Val–16S region (RNA boundaries unresolved)']
        features.append({'id': str(len(features)), 'type': kind, 'name': quals.get('gene', [product])[0], 'product': product,
                         'location': ft.findtext('GBFeature_location'), 'segments': segments,
                         'codonStart': int(quals.get('codon_start', ['1'])[0]), 'translationTable': int(quals.get('transl_table', ['2'])[0]),
                         'proteinId': quals.get('protein_id', [None])[0], 'translation': quals.get('translation', [None])[0],
                         'notes': quals.get('note', []), 'translationExceptions': quals.get('transl_except', [])})
    assert found_taxid == taxid, (found_taxid, taxid)
    gb = (ROOT / ('molecular-' + accession.replace('.', '-') + '-v0675.gb')).read_bytes() if '--cached' in sys.argv else fetch(base + '&rettype=gbwithparts&retmode=text')
    gb_name = 'molecular-' + accession.replace('.', '-') + '-v0675.gb'
    (ROOT / gb_name).write_bytes(gb)
    fasta = '>' + accession + ' ' + node.findtext('GBSeq_definition') + '\n' + '\n'.join(seq[i:i+70] for i in range(0, len(seq), 70)) + '\n'
    fasta_name = 'molecular-' + accession.replace('.', '-') + '-v0675.fasta'
    (ROOT / fasta_name).write_text(fasta, encoding='utf-8', newline='\n')
    record = {'completeness': 'partial' if species == 'agalychnis-callidryas' else 'complete', 'speciesId': species, 'accession': accession, 'taxonId': int(taxid), 'organism': node.findtext('GBSeq_organism'),
              'definition': node.findtext('GBSeq_definition'), 'length': len(seq), 'topology': node.findtext('GBSeq_topology'),
              'molecule': 'mitochondrial DNA', 'sequence': seq, 'sequenceSha256': hashlib.sha256(seq.encode()).hexdigest(),
              'features': features, 'retrieved': '2026-11-05', 'recordUpdated': node.findtext('GBSeq_update-date'),
              'sourceUrl': 'https://www.ncbi.nlm.nih.gov/nuccore/' + accession,
              'rawGenbank': gb_name, 'fasta': fasta_name, 'rawSha256': hashlib.sha256(gb).hexdigest(),
              'scope': ('Partial mitochondrial ribosomal DNA fragment; deposited fragment coordinates, not whole-mitochondrion coordinates. No protein-coding annotation is supplied.' if species == 'agalychnis-callidryas' else 'One deposited complete mitochondrial record; not a nuclear genome or the genotype of the rendered animal. The Bryde/Eden record is annotated as Balaenoptera edeni and does not resolve the archive’s disputed offshore/coastal taxonomy.' if species == 'balaenoptera-edeni' else 'One deposited complete mitochondrial record; not a nuclear genome or the genotype of the rendered animal.')}
    record['commonName'] = {'caperea-marginata': 'Pygmy right whale', 'balaenoptera-borealis': 'Sei whale', 'balaenoptera-acutorostrata': 'Common minke whale', 'balaenoptera-bonaerensis': 'Antarctic minke whale', 'balaenoptera-ricei': "Rice's whale", 'balaenoptera-edeni': 'Bryde’s / Eden’s whale', 'balaenoptera-omurai': "Omura's whale", 'globicephala-melas': 'Long-finned pilot whale', 'grampus-griseus': "Risso's dolphin", 'inia-geoffrensis': 'Amazon river dolphin', 'stenella-longirostris': 'Spinner dolphin', 'stenella-coeruleoalba': 'Striped dolphin', 'orcaella-brevirostris': 'Irrawaddy dolphin', 'hyperoodon-ampullatus': 'Northern bottlenose whale', 'mesoplodon-densirostris': "Blainville's beaked whale", 'kogia-sima': 'Dwarf sperm whale'}[species]
    record['database'] = 'RefSeq' if accession.startswith('NC_') else 'INSDC GenBank'
    records[species] = record
    print(species, accession, len(seq), 'CDS', sum(f['type']=='CDS' for f in features), 'all features', len(features), 'N', seq.count('N'), record['sequenceSha256'])

payload = {'version': '0.6.75', 'coordinateConvention': '1-based inclusive coordinates on the deposited forward strand; complement strand is antiparallel.',
           'source': 'NCBI Nucleotide / INSDC and RefSeq', 'records': records,
           'limits': 'Idealized local B-DNA illustration, not atomistic geometry, sequencing instrumentation, chromatin or a DNA-to-phenotype simulation.'}
(ROOT / 'molecular-data-v0675.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
