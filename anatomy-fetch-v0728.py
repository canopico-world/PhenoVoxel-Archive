"""Fetch exact public research inputs. Run from the repository root."""
from pathlib import Path
import hashlib,json,subprocess,urllib.request,zipfile

base=Path('research-cache/anatomy-v0728/source')
base.mkdir(parents=True,exist_ok=True)
manifest=json.loads(Path('anatomy-source-v0728.json').read_text(encoding='utf-8'))
for name,spec in manifest['files'].items():
    path=base/name
    if not path.exists():
        partial=path.with_suffix(path.suffix+'.partial')
        with urllib.request.urlopen(spec['url'],timeout=60)as response,partial.open('wb')as output:
            while block:=response.read(1048576):output.write(block)
        assert partial.stat().st_size==spec['bytes'] and hashlib.sha256(partial.read_bytes()).hexdigest()==spec['sha256'],name
        partial.replace(path)
    assert path.stat().st_size==spec['bytes'] and hashlib.sha256(path.read_bytes()).hexdigest()==spec['sha256'],name
    print('Verified',name,flush=True)
(base/'source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
with zipfile.ZipFile(base/'Z-Anatomy.zip')as archive:
    target=(base/'atlas').resolve()
    for item in archive.infolist():
        if not (target/item.filename).resolve().is_relative_to(target):raise ValueError('Unsafe ZIP member')
    archive.extractall(target)
target=(base/'biomechanics').resolve();target.mkdir(exist_ok=True)
# Windows includes bsdtar with 7z support. GNU tar users need a 7z-capable tool.
listing=subprocess.check_output(['tar','-tf',str((base/'Z-Biomechanics.7z').resolve())],text=True)
for member in listing.splitlines():
    if not (target/member).resolve().is_relative_to(target):raise ValueError('Unsafe 7z member')
subprocess.run(['tar','-xf',str((base/'Z-Biomechanics.7z').resolve()),'-C',str(target)],check=True)
neuron=base/'allen-human-571430815.swc'
if not neuron.exists():neuron.write_bytes(urllib.request.urlopen(manifest['neuron']['source'],timeout=30).read())
assert hashlib.sha256(neuron.read_bytes()).hexdigest()==manifest['neuron']['sha256']
