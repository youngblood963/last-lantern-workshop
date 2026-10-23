"""Issue/rotate the sole owner's private-host credential; never prints secrets.
The output belongs in a private password manager, never Git or shared reports.
Existing tester access is revoked by replacing TESTER_ACCESS_HASHES.
"""
import argparse, hashlib, json, os, secrets, time, urllib.request
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--credential-file',required=True)
p.add_argument('--account-id',required=True)
a=p.parse_args()
assert a.account_id=='b7bc43f3969d21604440c22cf3e1e4ef','Unexpected Cloudflare account'
path=Path(a.credential_file).resolve()
checkout=Path(__file__).resolve().parents[2]
assert not path.is_relative_to(checkout),'Credentials must be outside the repository'
credential={'username':'tester-owner','password':secrets.token_urlsafe(32),'expiresAt':int((time.time()+30*86400)*1000)}
with os.fdopen(os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'w') as f:json.dump(credential,f)
hash_value=hashlib.sha256((credential['username']+':'+credential['password']).encode()).hexdigest()
secret=json.dumps({'tester-owner':{'sha256':hash_value,'expiresAt':credential['expiresAt']}})
payload=json.dumps({'name':'TESTER_ACCESS_HASHES','type':'secret_text','text':secret}).encode()
url='https://api.cloudflare.com/client/v4/accounts/'+a.account_id+'/workers/scripts/route127-r14-private-playtest/secrets'
request=urllib.request.Request(url,data=payload,method='PUT',headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json','User-Agent':'Route127-Development-Verification/1.0'})
with urllib.request.urlopen(request,timeout=45) as r:result=json.load(r)
assert result['success'],'Secret installation failed; retain local credential file and investigate'
print('PASS: sole owner access installed; private credential file created (expires in 30 days).')
