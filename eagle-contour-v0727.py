"""Seat persistent flight feathers underneath the intact folded mantle."""
from pathlib import Path
import sys
import numpy as np
from scipy.spatial import cKDTree

folder=Path(sys.argv[1] if len(sys.argv)>1 else 'research-cache/eagle-v0727/geometry')
def read(name,width,dtype='<f4'):
    return np.fromfile(folder/(name+'.bin'),dtype=dtype).reshape(-1,width)

donor=read('donor-position',3)
normal=read('donor-normal',3)
closed=read('wing-closed',3)
matrix=read('wing-transform',9).reshape(-1,3,3).transpose(0,2,1)
previous=read('wing-fold',3)
ids=read('wing-joints',4,'u1')
weight=read('wing-weights',4)
wing=np.sum(np.isin(ids,[1,2,3,4,5,6])*weight,axis=1)
tree=cKDTree(donor)
distance,nearest=tree.query(closed)
axis=np.array([.66,np.sqrt(1-.66**2),0.])
offset=donor[nearest]-[-.33,.58,0]
radial=offset-(offset@axis)[:,None]*axis
radial/=np.maximum(np.linalg.norm(radial,axis=1,keepdims=True),1e-6)
target=donor[nearest]-.044*radial
invertible=np.abs(np.linalg.det(matrix))>.0001
inverse=np.zeros_like(matrix)
inverse[invertible]=np.linalg.inv(matrix[invertible])
correction=np.einsum('nij,nj->ni',inverse,target-closed)
correction[~invertible]=0
result=previous+correction
result[wing<.001]=previous[wing<.001]
result.astype('<f4').tofile(folder/'wing-corrected-fold.bin')
# Cancel the earlier folded normal correction as the same packing weight is
# applied to both morphs. The source feather normals follow the shared joints.
delta=-read('wing-prior-normal',3)
delta.astype('<f4').tofile(folder/'wing-corrected-normal.bin')
print('Prepared wing packing',len(result),'vertices, median reference gap',float(np.median(distance[wing>.1])),flush=True)
