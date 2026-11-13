"""Reproduce the exploratory, one-specimen PhenoVoxel motor-route robustness audit.

Run: python research-connectome-v0720.py
Requires numpy, pandas, pyarrow. No network, credentials, RNG, fitted dynamics or p-values.
Raw input paths/hashes and dated analysis plan are fixed in research-plan-v0720.json.
Compact public outputs are JSON/CSV; detailed contributions remain in research-cache.
"""
from pathlib import Path
from collections import defaultdict
import csv
import hashlib
import json
import math
import platform
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / 'research-cache/research-v0720'
RAW = ROOT / 'research-cache/motor-lab-v0719'
THRESHOLDS = (1, 5, 10, 15, 20, 50)
SOURCE_IDS = (10360, 523769, 11074, 512006)


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def write_json(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False,
                               indent=None if compact else 2,
                               separators=(',', ':') if compact else None) + '\n', encoding='utf-8')


def index_edges(rows):
    """Reject selected pair duplicates; never silently double-count."""
    indexed = defaultdict(dict)
    for pre, post, weight in rows:
        pre, post, weight = int(pre), int(post), int(weight)
        if weight <= 0:
            raise ValueError('Nonpositive edge weight')
        if post in indexed[pre]:
            raise ValueError(f'Duplicate edge {pre}->{post}')
        indexed[pre][post] = weight
    return dict(indexed)


def laterality(ipsi, contra):
    denominator = ipsi + contra
    return (contra - ipsi) / denominator if denominator > 0 else None


def stable_sum(values):
    return math.fsum(values)


def evaluate(source, source_side, endpoints, intermediates, edges, outgoing, threshold, route):
    """Compute one setting. endpoints maps ID to annotated side, not muscle side."""
    targets = defaultdict(list)
    branches = defaultdict(lambda: defaultdict(list))
    paths = 0
    source_total = outgoing.get(source, 0)
    if source_total > 0:
        for first, w1 in sorted(edges.get(source, {}).items()):
            if first == source or w1 < threshold:
                continue
            if route == 'direct':
                if first in endpoints:
                    targets[first].append(w1 / source_total)
                    paths += 1
                continue
            if first not in intermediates or outgoing.get(first, 0) <= 0:
                continue
            for target, w2 in sorted(edges.get(first, {}).items()):
                if target not in endpoints or target in (source, first) or w2 < threshold:
                    continue
                score = (w1 / source_total) * (w2 / outgoing[first])
                targets[target].append(score)
                branches[first][target].append(score)
                paths += 1
    target_mass = {t: stable_sum(v) for t, v in sorted(targets.items())}
    branch_mass = {i: {t: stable_sum(v) for t, v in sorted(parts.items())}
                   for i, parts in sorted(branches.items())}
    totals = {'ipsi': [], 'contra': [], 'unknown': []}
    reached = dict.fromkeys(totals, 0)
    available = dict.fromkeys(totals, 0)

    def relative(side):
        return ('ipsi' if side == source_side else 'contra') if side in ('L', 'R') else 'unknown'

    for target, side in endpoints.items():
        available[relative(side)] += 1
    for target, mass in target_mass.items():
        rel = relative(endpoints[target])
        totals[rel].append(mass)
        reached[rel] += 1
    total = {s: stable_sum(v) for s, v in totals.items()}
    mass = stable_sum(total.values())
    if mass > 1 + 1e-12:
        raise AssertionError(f'Routing mass >1: {mass}')
    rates = {s: reached[s] / available[s] if available[s] else None for s in total}
    corrected = laterality(rates['ipsi'], rates['contra']) if None not in (rates['ipsi'], rates['contra']) else None
    top = None
    concentration = None
    deleted_li = None
    deleted_mass = None
    if branch_mass:
        top = min(branch_mass, key=lambda i: (-stable_sum(branch_mass[i].values()), i))
        top_mass = stable_sum(branch_mass[top].values())
        concentration = top_mass / mass if mass > 0 else None
        remain = {'ipsi': [], 'contra': [], 'unknown': []}
        for target, value in target_mass.items():
            rest = max(0.0, value - branch_mass[top].get(target, 0))
            remain[relative(endpoints[target])].append(rest)
        remainder = {s: stable_sum(v) for s, v in remain.items()}
        deleted_li = laterality(remainder['ipsi'], remainder['contra'])
        deleted_mass = stable_sum(remainder.values())
    return {
        'mass': mass, 'ipsi_mass': total['ipsi'], 'contra_mass': total['contra'],
        'unknown_mass': total['unknown'], 'known_side_coverage': (total['ipsi'] + total['contra']) / mass if mass else None,
        'li': laterality(total['ipsi'], total['contra']),
        'reach_li': laterality(reached['ipsi'], reached['contra']),
        'available_reach_li': corrected, 'reached': reached, 'available': available,
        'paths': paths, 'intermediates': len(branch_mass), 'top_intermediate': top,
        'top_share': concentration, 'deleted_li': deleted_li, 'deleted_mass': deleted_mass,
        'target_mass': target_mass, 'branch_mass': branch_mass,
        'status': 'available' if mass else 'no_eligible_route',
    }


def extract(plan):
    """Two streaming passes, no full-graph pandas/object adjacency."""
    import numpy as np
    import pyarrow as pa
    import pyarrow.compute as pc
    import pyarrow.feather as feather
    import pyarrow.ipc as ipc
    import pandas as pd

    for name, expected in plan['source_hashes'].items():
        actual = digest(RAW / name)
        if actual != expected:
            raise ValueError(f'Input hash mismatch: {name}')
    columns = ['bodyId', 'instance', 'type', 'superclass', 'subclass', 'somaSide',
               'somaNeuromere', 'rootSide', 'exitNerve', 'statusLabel']
    frame = feather.read_table(RAW / 'annotations.feather', columns=columns).to_pandas()
    if frame.bodyId.duplicated().any():
        raise ValueError('Duplicate annotation bodyId')
    frame = frame.set_index('bodyId', drop=False)
    for cell in plan['cells']:
        row = frame.loc[cell['bodyId']]
        if row['instance'] != cell['instance'] or row.somaSide != cell['somaSide']:
            raise ValueError('Source cell identity mismatch')
    motor_ids = set(frame[(frame.superclass == 'vnc_motor') & (frame.somaNeuromere == 'T1')].index.astype(int))
    intrinsic_ids = set(frame[frame.superclass == 'vnc_intrinsic'].index.astype(int))
    reader = ipc.open_file(pa.memory_map(str(RAW / 'weights.feather')))
    if reader.schema.names != ['body_pre', 'body_post', 'weight']:
        raise ValueError('Unexpected weight schema')
    source_arrow = pa.array(SOURCE_IDS, type=pa.int64())
    source_rows = []
    source_totals = {s: 0 for s in SOURCE_IDS}
    input_rows = 0
    for b in range(reader.num_record_batches):
        batch = reader.get_batch(b)
        input_rows += batch.num_rows
        weights = batch.column(2)
        if pc.any(pc.less_equal(weights, 0)).as_py():
            raise ValueError('Nonpositive released weight')
        selected = batch.filter(pc.is_in(batch.column(0), value_set=source_arrow)).to_pydict()
        for p, q, w in zip(selected['body_pre'], selected['body_post'], selected['weight']):
            source_rows.append((p, q, w))
            source_totals[p] += w
    index_edges(source_rows)
    candidate_ids = sorted({q for p, q, w in source_rows if q in intrinsic_ids and q != p})
    candidate_arrow = pa.array(candidate_ids, type=pa.int64())
    motor_arrow = pa.array(sorted(motor_ids), type=pa.int64())
    candidate_totals = np.zeros(len(candidate_ids), dtype=np.int64)
    middle_rows = []
    for b in range(reader.num_record_batches):
        batch = reader.get_batch(b)
        ids = pc.fill_null(pc.index_in(batch.column(0), value_set=candidate_arrow), -1).to_numpy()
        valid = ids >= 0
        if not valid.any():
            continue
        weights = batch.column(2).to_numpy()
        np.add.at(candidate_totals, ids[valid], weights[valid])
        mask = pa.array(valid)
        mask = pc.and_(mask, pc.is_in(batch.column(1), value_set=motor_arrow))
        selected = batch.filter(mask).to_pydict()
        middle_rows.extend(zip(selected['body_pre'], selected['body_post'], selected['weight']))
    index_edges(middle_rows)
    used_ids = sorted(set(SOURCE_IDS) | motor_ids | set(candidate_ids))
    metadata = json.loads(frame.loc[used_ids, columns].to_json(orient='records'))
    outgoing = {**source_totals, **{i: int(w) for i, w in zip(candidate_ids, candidate_totals)}}
    extracted = {'source_hashes': plan['source_hashes'], 'sources': sorted(source_rows),
                 'intermediates': sorted(middle_rows), 'outgoing': outgoing,
                 'metadata': metadata, 'input_rows_scanned_per_pass': input_rows,
                 'environment': {'python': platform.python_version(), 'numpy': np.__version__,
                                 'pyarrow': pa.__version__, 'pandas': pd.__version__}}
    write_json(CACHE / 'extracted-graph.json', extracted, compact=True)
    print(f'Extracted {len(source_rows)} source edges, {len(candidate_ids)} intrinsic candidates, '
          f'{len(middle_rows)} intrinsic-to-T1 motor edges.', flush=True)
    return extracted


def audit_examples(plan, graph, edges, endpoints, metadata):
    audited = []
    outgoing = {int(k): v for k, v in graph['outgoing'].items()}
    intrinsic = {i for i, m in metadata.items() if m['superclass'] == 'vnc_intrinsic'}
    for ex in plan['example_paths']:
        s, i, m = (ex[k] for k in ('source', 'intermediate', 'endpoint'))
        r = evaluate(s, metadata[s]['somaSide'], endpoints, intrinsic, edges, outgoing, 10, 'allIN')
        ranked = sorted(r['target_mass'], key=lambda target: (-r['target_mass'][target], target))
        endpoint_mass = r['target_mass'].get(m, 0)
        path_mass = r['branch_mass'].get(i, {}).get(m, 0)
        audited.append({**ex, 'endpoint_rank': ranked.index(m) + 1 if m in ranked else None,
                        'reached_endpoint_count': len(ranked),
                        'endpoint_share': endpoint_mass / r['mass'] if r['mass'] else None,
                        'single_path_share': path_mass / r['mass'] if r['mass'] else None})
    return audited


def overview(rows):
    out = []
    for source in SOURCE_IDS:
        for metric in ('li', 'available_reach_li'):
            relevant = [r for r in rows if r['source'] == source]
            values = [r[metric] for r in relevant if r[metric] is not None]
            nonzero = [x for x in values if abs(x) > 1e-12]
            out.append({'source': source, 'metric': metric, 'available_settings': len(values),
                        'total_settings': len(relevant), 'min': min(values) if values else None,
                        'max': max(values) if values else None,
                        'positive': sum(x > 1e-12 for x in nonzero),
                        'negative': sum(x < -1e-12 for x in nonzero),
                        'zero': len(values) - len(nonzero)})
    return out


def plot_primary(rows, metadata):
    """Standard scientific plot; retention annotation prevents overreading LI."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams.update({'svg.fonttype': 'none', 'font.family': 'DejaVu Sans',
                         'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ['#007c91', '#3547a4', '#c36610', '#aa3679']
    styles = ['-', '--', '-', '--']
    for source, color, style in zip(SOURCE_IDS, colors, styles):
        subset = [r for r in rows if r['source'] == source and r['endpoint'] == 'fl' and r['route'] == 'allIN']
        x = [r['threshold'] for r in subset]
        ax.plot(x, [r['li'] for r in subset], color=color, linestyle=style,
                linewidth=1.8, label=metadata[source]['instance'])
    ax.axhline(0, color='#666666', linewidth=.6)
    ax.set_ylabel('Motor-soma-side index (contra - ipsi) / total')
    ax.set_ylim(-1.1, 1.1)
    ax.set_yticks([-1, 0, 1])
    ax.set_xlabel('Minimum synapses per edge')
    ax.set_xticks(THRESHOLDS)
    handles, labels = ax.get_legend_handles_labels()
    fig.legend(handles, labels, loc='upper center', ncol=4, frameon=False, bbox_to_anchor=(.5, .92))
    fig.suptitle('One specimen: foreleg motor somata, two-edge intrinsic routes', fontsize=12, y=.99)
    r50 = [r['retention'] for r in rows if r['endpoint'] == 'fl' and r['route'] == 'allIN' and r['threshold'] == 50]
    fig.text(.5, .065, f'Stable side signs; threshold 50 retains only {min(r50):.1%} to {max(r50):.1%} of threshold-1 routing mass.', ha='center', fontsize=9)
    fig.text(.5, .015, 'Graph sensitivity only: no biological confidence interval or muscle-side validation.', ha='center', fontsize=9)
    fig.subplots_adjust(top=.76, bottom=.23, left=.11, right=.98)
    fig.savefig(ROOT / 'research-connectome-v0720.svg', metadata={'Date': None})
    # Lossless whitespace removal; modest coordinate rounding for a compact web figure.
    import re
    import xml.etree.ElementTree as ET
    path = ROOT / 'research-connectome-v0720.svg'
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
    tree = ET.parse(path)
    for elem in tree.iter():
        if elem.text and not elem.text.strip(): elem.text = None
        if elem.tail and not elem.tail.strip(): elem.tail = None
        for key, value in list(elem.attrib.items()):
            if key in ('d', 'transform'):
                elem.set(key, re.sub(r'-?\d+\.\d{4,}', lambda m: format(float(m.group()), '.3f').rstrip('0').rstrip('.'), value))
    tree.write(path, encoding='utf-8', xml_declaration=True)
    fig.savefig(CACHE / 'research-connectome-v0720.png', dpi=140)
    plt.close(fig)
    return matplotlib.__version__


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    plan_path = ROOT / 'research-plan-v0720.json'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    plan_hash = digest(plan_path)
    graph = extract(plan)
    meta = {m['bodyId']: m for m in graph['metadata']}
    edges = index_edges(graph['sources'] + graph['intermediates'])
    outgoing = {int(k): v for k, v in graph['outgoing'].items()}
    endpoints = {
        'T1': {i: m['somaSide'] for i, m in meta.items() if m['superclass'] == 'vnc_motor' and m['somaNeuromere'] == 'T1'},
        'fl': {i: m['somaSide'] for i, m in meta.items() if m['superclass'] == 'vnc_motor' and m['somaNeuromere'] == 'T1' and m['subclass'] == 'fl'},
    }
    intrinsic = {i for i, m in meta.items() if m['superclass'] == 'vnc_intrinsic'}
    middle_sets = {'direct': set(), 'allIN': intrinsic,
                   'T1IN': {i for i in intrinsic if meta[i]['somaNeuromere'] == 'T1'}}
    records = []
    targets = []
    for source in SOURCE_IDS:
        for endpoint_name in ('fl', 'T1'):
            for route, middle in middle_sets.items():
                baseline_mass = None
                last_mass, last_count = math.inf, math.inf
                for threshold in THRESHOLDS:
                    r = evaluate(source, meta[source]['somaSide'], endpoints[endpoint_name], middle,
                                 edges, outgoing, threshold, route)
                    if threshold == 1:
                        baseline_mass = r['mass']
                    count = sum(r['reached'].values())
                    if r['mass'] > last_mass + 1e-12 or count > last_count:
                        raise AssertionError('Threshold monotonicity failed')
                    last_mass, last_count = r['mass'], count
                    r['retention'] = r['mass'] / baseline_mass if baseline_mass else None
                    key = {'source': source, 'endpoint': endpoint_name, 'route': route, 'threshold': threshold}
                    for target, score in r.pop('target_mass').items():
                        targets.append({**key, 'motor_bodyId': target, 'motor_somaSide': meta[target]['somaSide'], 'routing_mass': score})
                    r.pop('branch_mass')
                    records.append({**key, **r})
    write_json(CACHE / 'full-settings.json', records)
    with (CACHE / 'per-target-contributions.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['source', 'endpoint', 'route', 'threshold', 'motor_bodyId', 'motor_somaSide', 'routing_mass'])
        writer.writeheader()
        writer.writerows(targets)
    fields = ['source', 'endpoint', 'route', 'threshold', 'mass', 'li', 'reach_li', 'available_reach_li',
              'ipsi_reached', 'contra_reached', 'unknown_reached', 'paths', 'intermediates', 'retention',
              'top_intermediate', 'top_share', 'deleted_li', 'deleted_mass']
    with (ROOT / 'research-connectome-v0720.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in records:
            row = {k: r.get(k) for k in fields}
            for side in ('ipsi', 'contra', 'unknown'):
                row[f'{side}_reached'] = r['reached'][side]
            writer.writerow({k: format(v, '.9g') if isinstance(v, float) else v for k, v in row.items()})
    primary = [r for r in records if r['endpoint'] == 'fl' and r['route'] == 'allIN' and r['threshold'] == 10]
    examples = audit_examples(plan, graph, edges, endpoints['fl'], meta)
    graph['environment']['matplotlib'] = plot_primary(records, meta)
    expected = {r['bodyId']: r['reference_sign'] for r in plan['cells']}
    consistent = sum(r['li'] is not None and r['li'] * expected[r['source']] > 0 for r in records)
    summary = {
        'version': 'v0.7.20', 'title': plan['title'],
        'computed_at_utc': datetime.now(timezone.utc).isoformat(),
        'status': 'Exploratory single-specimen secondary analysis; not preregistered or peer reviewed',
        'plan_amendment': plan['amendment'],
        'raw_inputs': plan['raw_inputs'], 'reproduction': plan['reproduction'],
        'plan_sha256': plan_hash, 'source_hashes': graph['source_hashes'], 'environment': graph['environment'],
        'code_sha256': digest(Path(__file__)), 'settings': len(records), 'animals': 1,
        'sources': [{k: meta[s][k] for k in ('bodyId', 'instance', 'somaSide', 'statusLabel')} for s in SOURCE_IDS],
        'endpoint_counts': {name: {side: sum(v == side for v in mapping.values()) for side in ('L', 'R')} for name, mapping in endpoints.items()},
        'primary': primary, 'all_setting_sensitivity': overview(records), 'previous_examples': examples,
        'robustness': {'defined_settings': sum(r['li'] is not None for r in records),
                       'sign_consistent_with_known_reference': consistent,
                       'interpretation': 'This confirms descriptive sign stability within the chosen graph definitions, not a new motor mechanism. Stronger thresholds retain less mass even where the side index approaches an extreme.'},
        'primary_definition': 'Foreleg-annotated T1 motor neurons; all vnc_intrinsic intermediate somata; exact two-edge paths; both edges >=10 synapses',
        'scores': plan['score_definitions'],
        'interpretation': 'Positive LI denotes contralateral annotated motor soma relative to DN soma; it does not denote the side of a muscle or turn. Ranges across analytic settings are sensitivity ranges, not confidence intervals.',
        'limitations': plan['limitations'] + [plan['metadata_caveat']],
        'availability': 'Blank CSV metrics and JSON null mean undefined/no denominator; they are not zero effects.',
        'provenance': plan['sources'],
        'files': {'all_settings': 'research-connectome-v0720.csv', 'code': 'research-connectome-v0720.py',
                  'tests': 'research-connectome-v0720.test.py', 'plan': 'research-plan-v0720.json'},
    }
    write_json(ROOT / 'research-connectome-v0720.json', summary, compact=True)
    byte_count = sum((ROOT / f'research-connectome-v0720.{extension}').stat().st_size for extension in ('json', 'csv'))
    if byte_count > 40960:
        raise AssertionError(f'Public result budget exceeded: {byte_count}')
    print(json.dumps({'public_result_bytes': byte_count, 'settings': len(records), 'primary': primary,
                      'previous_examples': examples}, indent=2))


if __name__ == '__main__':
    main()
