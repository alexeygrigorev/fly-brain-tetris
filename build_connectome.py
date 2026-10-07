"""Compile a fixed, linear whole-connectome reservoir into its exact input/output map."""
import argparse, csv, gzip, hashlib, json
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix, diags

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--data-dir', type=Path, default=HERE / 'data/783', help='Directory containing downloaded FAFB v783 CSV.gz tables')
DATA = parser.parse_args().data_dir
def read(name):
    return csv.DictReader(gzip.open(DATA/name, 'rt', encoding='utf-8'))
neurons = list(read('neurons.csv.gz'))
ids = [r['root_id'] for r in neurons]
index = {rid:i for i,rid in enumerate(ids)}
nt = np.array([-1.0 if r['nt_type']=='GABA' else 1.0 for r in neurons])
classes = {r['root_id']:r for r in read('classification.csv.gz')}
sensory = np.array([i for i,rid in enumerate(ids) if classes[rid]['super_class']=='sensory'])
descending = np.array([i for i,rid in enumerate(ids) if classes[rid]['super_class']=='descending'])
print('Reading whole-brain edges...', flush=True)
pre, post, weight = [], [], []
for r in read('connections_princeton.csv.gz'):
    a,b = index.get(r['pre_root_id']),index.get(r['post_root_id'])
    if a is not None and b is not None:
        pre.append(a); post.append(b); weight.append(float(r['syn_count'])*nt[a])
W = coo_matrix((np.array(weight,dtype=np.float64),(post,pre)),shape=(len(ids),len(ids))).tocsr()
W.sum_duplicates()
del pre,post,weight
row_mass=np.asarray(abs(W).sum(axis=1)).ravel()
W=diags(1/np.maximum(row_mass,1))@W
rng=np.random.default_rng(783)
rng.shuffle(sensory); rng.shuffle(descending)
input_groups=np.array_split(sensory,6)
output_groups=np.array_split(descending,4)
B=np.zeros((len(ids),6))
for j,g in enumerate(input_groups): B[g,j]=1
# Actual annotated cell coordinates for a sampled activity view, not invented anatomy.
positions={}
for row in read('coordinates.csv.gz'):
    if row['root_id'] not in positions:
        positions[row['root_id']]=[float(v) for v in row['position'].strip('[]').split()]
groups=[]
for group,size in [('sensory',180),('optic',380),('central',280),('descending',160)]:
    eligible=[i for i,rid in enumerate(ids) if classes[rid]['super_class']==group and rid in positions]
    groups.extend(rng.choice(eligible,min(size,len(eligible)),replace=False).tolist())
sample=np.array(groups)
sample_states=[]
state=np.zeros_like(B)
responses=[]
for step in range(8):
    state=0.25*state+0.75*(W@state+B)
    sample_states.append(state[sample].copy())
    responses.extend([state[g].mean(axis=0).tolist() for g in output_groups])
T=np.array(responses)
# Normalize channel amplitudes, preserving the wiring-dependent input/output map.
scale=np.linalg.norm(T,axis=1)
T=T/np.maximum(scale[:,None],1e-12)
s=np.linalg.svd(T,compute_uv=False)
assert np.linalg.matrix_rank(T)==6, 'Sensory-to-descending mapping loses input dimensions'
source=DATA/'connections_princeton.csv.gz'
result=dict(dataset='FAFB v783',neurons=len(ids),connections=int(W.nnz),sensory_neurons=len(sensory),
    descending_neurons=len(descending),steps=8,channels=32,features=['aggregate_height','holes','bumpiness','max_height','wells','cleared_lines'],
    transform=T.tolist(),pseudoinverse=np.linalg.pinv(T).tolist(),singular_values=s.tolist(),seed=783,
    source_sha256=hashlib.file_digest(open(source,'rb'),'sha256').hexdigest(),
    input_root_ids=[[ids[i] for i in g] for g in input_groups],output_root_ids=[[ids[i] for i in g] for g in output_groups],
    dynamics='x[t+1] = 0.25*x[t] + 0.75*(W*x[t] + B*u); W is signed by GABA and normalized by postsynaptic absolute input mass')
(HERE/'connectome.json').write_text(json.dumps(result),encoding='utf-8')
sample_states=np.array(sample_states)
cell_scale=np.maximum(np.max(np.sum(np.abs(sample_states),axis=2),axis=0),1e-12)
telemetry=dict(cells=[dict(root_id=ids[i],position=positions[ids[i]],group=classes[ids[i]]['super_class']) for i in sample],
    response_basis=np.round(sample_states/cell_scale[None,:,None],7).tolist(),
    output_basis=np.round(np.array(responses).reshape(8,4,6)/np.maximum(scale.reshape(8,4,1),1e-12),9).tolist(),
    view='Actual annotated neuron positions, x/z projection; cell responses normalized by each cell basis-response maximum')
(HERE/'activity.json').write_text(json.dumps(telemetry,separators=(',',':')),encoding='utf-8')
print(json.dumps({k:result[k] for k in ['neurons','connections','sensory_neurons','descending_neurons','singular_values']}),flush=True)
