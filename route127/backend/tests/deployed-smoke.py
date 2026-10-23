"""Explicit opt-in smoke test: creates two development accounts and snapshots.
Usage: python tests/deployed-smoke.py https://YOUR-DEVELOPMENT-WORKER
Generated credentials/cookies stay in memory and are never printed or saved.
"""
import urllib.request, urllib.error, json, secrets, uuid, sys
origin=sys.argv[1].rstrip('/')
assert origin.startswith(('https://route127-r12-dev-api.', 'http://127.0.0.1:')), 'Development targets only'
results=[]
def call(path, data=None, cookie='', origin_header=None, raw=None, content_type='application/json'):
 # Identify this opt-in development probe; Cloudflare rejects urllib's default
 # User-Agent with error 1010 before the request reaches the Worker.
 headers={'User-Agent':'Route127-Development-Verification/1.0'}
 payload=raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
 if payload is not None:headers.update({'Content-Type':content_type,'Origin':origin if origin_header is None else origin_header})
 if cookie:headers['Cookie']=cookie
 request=urllib.request.Request(origin+'/api/'+path, data=payload, headers=headers)
 try:r=urllib.request.urlopen(request,timeout=45)
 except urllib.error.HTTPError as e:r=e
 try:body=json.load(r)
 except Exception:raise AssertionError('Non-JSON response from '+path+' status '+str(r.status))
 return r.status,body,r.headers

def check(label, response, status):
 assert response[0]==status, label+': expected '+str(status)+', got '+str(response[0])+' '+str(response[1])
 results.append(label); print('PASS:',label);return response
password=secrets.token_urlsafe(32);prefix='r12_'+secrets.token_hex(6)
a=prefix+'_a';b=prefix+'_b'
check('health',call('health'),200)
check('unauthenticated access denied',call('me'),401)
check('foreign origin denied',call('register',{'login':a,'password':password},origin_header='https://invalid.test'),403)
check('malformed JSON denied',call('register',raw=b'{'),400)
check('invalid account denied',call('register',{'login':'!','password':'short'}),400)
reg=check('account registration',call('register',{'login':a,'password':password}),200)
cookie=reg[2].get('Set-Cookie');assert all(x in cookie for x in ['HttpOnly','Secure','SameSite=Strict','Path=/'])
cookie=cookie.split(';')[0];results.append('protected cookie attributes')
check('duplicate registration denied',call('register',{'login':a.upper(),'password':password}),409)
check('wrong password denied',call('login',{'login':a,'password':secrets.token_urlsafe(24)}),401)
regb=check('second development account',call('register',{'login':b,'password':password}),200);cookieb=regb[2]['Set-Cookie'].split(';')[0]
snapshot={'version':38,'stage':'mercy','day':1,'player':{'characterId':'local-test','handle':'Ranger Test','flags':{'quest':'active'},'bolts':200,'bankBolts':50,'turns':40,'level':3,'xp':200,'pack':[{'name':'Rusted Pipe','qty':1}]}}
check('invalid snapshot denied',call('character',{'snapshot':{'version':1}},cookie),400)
create=check('server identity character creation',call('character',{'snapshot':snapshot},cookie),201);cid=create[1]['character']['id'];assert cid.startswith('char-') and cid!='local-test'
check('second character denied',call('character',{'snapshot':snapshot},cookie),409)
check('other account cannot retrieve character',call('save?accountId='+reg[1]['accountId']+'&characterId='+cid,cookie=cookieb),404)
snapshot['player']['characterId']=cid;snapshot['player']['handle']='Saved Ranger';snapshot['player']['bolts']=237
payload={'revision':0,'requestId':str(uuid.uuid4()),'snapshot':snapshot}
check('persistent save',call('save',payload,cookie),200)
replay=check('idempotent retry',call('save',payload,cookie),200);assert replay[1]['replayed'] is True
check('stale revision conflict',call('save',{**payload,'requestId':str(uuid.uuid4())},cookie),409)
forged=json.loads(json.dumps(snapshot));forged['player']['characterId']='char-other'
check('forged character denied',call('save',{**payload,'revision':1,'snapshot':forged},cookie),403)
check('second character account creation',call('character',{'snapshot':snapshot},cookieb),201)
check('other account cannot overwrite character',call('save',payload,cookieb),403)
login=check('separate session login',call('login',{'login':a,'password':password}),200);cookie2=login[2]['Set-Cookie'].split(';')[0]
loaded=check('persistent load across independent sessions',call('save',cookie=cookie2),200);assert loaded[1]['snapshot']==snapshot and loaded[1]['revision']==1 and loaded[1]['character']['name']=='Saved Ranger'
check('logout',call('logout',{},cookie2),200)
check('revoked session denied',call('me',cookie=cookie2),401)
check('original session remains valid',call('me',cookie=cookie),200)
check('oversized request denied',call('save',raw=b' '*530000,cookie=cookie),413)
check('wrong content type denied',call('save',raw=b'{}',cookie=cookie,content_type='text/plain'),415)
# Authentication throttling deliberately last; one shared caller IP.
status=None
for _ in range(12):
 status=call('login',{'login':prefix+'_missing','password':password})
 if status[0]==429:break
check('authentication throttling',status,429)
check('logout original session',call('logout',{},cookie),200)
check('logout second account',call('logout',{},cookieb),200)
print('PASS:',len(results),'checks; only generated development accounts/snapshots written. Credentials discarded.')
