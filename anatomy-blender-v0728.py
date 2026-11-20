from pathlib import Path
import hashlib,json,re,urllib.request,zipfile

folder=Path('research-cache/anatomy-v0728/tools')
folder.mkdir(parents=True,exist_ok=True)
origin='https://download.blender.org/release/Blender4.5/'
with urllib.request.urlopen(origin,timeout=20)as r:index=r.read().decode()
filename='blender-4.5.16-windows-x64.zip'
checksum_name=filename.replace('-windows-x64.zip','.sha256')
assert checksum_name in index
with urllib.request.urlopen(origin+checksum_name,timeout=20)as r:checksums=r.read().decode()
expected=next(line.split()[0] for line in checksums.splitlines() if line.rstrip().endswith(filename))
archive=folder/filename
if not archive.exists():
    with urllib.request.urlopen(origin+filename,timeout=45)as r,archive.open('wb')as out:
        received=0
        while block:=r.read(1024*1024):
            out.write(block)
            received+=len(block)
            if received%(32*1024*1024)==0:print('Blender download MiB',received//1048576,flush=True)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
assert digest==expected,(digest,expected)
with zipfile.ZipFile(archive)as z:
    for item in z.infolist():
        assert (folder/item.filename).resolve().is_relative_to(folder.resolve())
    z.extractall(folder)
executable=next(folder.glob('*/blender.exe'))
(folder/'vendor.json').write_text(json.dumps({'source':origin+filename,'checksumSource':origin+checksum_name,'sha256':digest,'executable':str(executable.resolve())},indent=2)+'\n')
print('Verified portable Blender',executable,flush=True)
