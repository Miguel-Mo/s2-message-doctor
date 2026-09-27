import ast, json, re, os, hashlib
from pathlib import Path
root=Path.cwd(); dest=root/'external-corpus';dest.mkdir(exist_ok=True)
meta=[]
def save(text,repo,commit,path,kind,line=None):
 h=hashlib.sha256(text.encode()).hexdigest()
 if any(x['sha256']==h and x['repository']==repo for x in meta):return
 name=f'{len(meta)+1:03d}.json';(dest/name).write_bytes(text.encode('utf-8'))
 meta.append(dict(file=name,repository=repo,commit=commit,path=path,line=line,kind=kind,sha256=h,url=f'https://github.com/{repo}/blob/{commit}/{path}'+(f'#L{line}' if line else '')))
tmp=Path(os.environ.get('TEMP', '/tmp'))
# Only this explicit acquisition step accesses the network; validation is local.
import subprocess
for folder,repo,commit in [
 ('s2-external-kit','hupe1980/s2-kit','6db0a991bb1037680f4aed26c2e7340d4a65ee67'),
 ('s2-external-ruby','stekker/s2-ruby','4175477526a0bf2209858e52b7ac72e354f5409f'),
 ('s2-python-research','flexiblepower/s2-python','ea46bde1598ee9e73a1313bbdbc59722d6e047c6')]:
 directory=tmp/folder
 if not directory.exists():
  subprocess.run(['git','clone','--no-checkout',f'https://github.com/{repo}.git',str(directory)],check=True)
  subprocess.run(['git','-C',str(directory),'checkout','--detach',commit],check=True)
 actual=subprocess.check_output(['git','-C',str(directory),'rev-parse','HEAD'],text=True).strip()
 if actual != commit: raise RuntimeError(f'{directory}: expected {commit}, got {actual}; use a clean temporary directory')
kit=tmp/'s2-external-kit';sha='6db0a991bb1037680f4aed26c2e7340d4a65ee67'
for p in sorted((kit/'tests/fixtures/official').glob('*.json')):save(p.read_bytes().decode(), 'hupe1980/s2-kit',sha,p.relative_to(kit).as_posix(),'documentation example reused as implementation fixture')
ruby=tmp/'s2-external-ruby';p=ruby/'spec/s2/message_factory_spec.rb';text=p.read_text(encoding='utf-8')
for m in re.finditer(r'<<~JSON\n(.*?)\n\s*JSON',text,re.S):
 import textwrap
 save(textwrap.dedent(m[1]),'stekker/s2-ruby','4175477526a0bf2209858e52b7ac72e354f5409f',p.relative_to(ruby).as_posix(),'unit-test heredoc; includes deliberate negative cases',text[:m.start()].count('\n')+1)
py=tmp/'s2-python-research'
for p in sorted((py/'tests').rglob('*.py')):
 try:tree=ast.parse(p.read_text(encoding='utf-8'))
 except (SyntaxError,UnicodeError):continue
 for n in ast.walk(tree):
  if isinstance(n,ast.Constant) and isinstance(n.value,str):
   try:data=json.loads(n.value)
   except (ValueError,TypeError):continue
   if isinstance(data,dict) and 'message_type' in data:save(n.value,'flexiblepower/s2-python','ea46bde1598ee9e73a1313bbdbc59722d6e047c6',p.relative_to(py).as_posix(),'literal JSON string from unit test',n.lineno)
  elif isinstance(n,ast.Dict):
   try:data=ast.literal_eval(n)
   except (ValueError,TypeError):continue
   if isinstance(data,dict) and 'message_type' in data:
    try:text=json.dumps(data,ensure_ascii=False,indent=2)
    except (TypeError,ValueError):continue
    save(text,'flexiblepower/s2-python','ea46bde1598ee9e73a1313bbdbc59722d6e047c6',p.relative_to(py).as_posix(),'literal Python dict from unit test; serialized to JSON without value edits',n.lineno)
(dest/'manifest.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(len(meta),'messages collected')
