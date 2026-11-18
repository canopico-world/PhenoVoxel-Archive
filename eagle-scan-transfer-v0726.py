"""Fit the v0.7.25 folded eagle to radial sections of the credited v0.7.24 standing scan."""
from dataclasses import dataclass
from pathlib import Path
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.sparse import coo_matrix

AXIS = np.array([.660, np.sqrt(1-.660**2), 0])
ACROSS = np.array([AXIS[1], -AXIS[0], 0])
LATERAL = np.array([0.,0.,1.])
FRAME = np.column_stack([AXIS,ACROSS,LATERAL])
TAU = 2*np.pi
REGISTER_SOURCE = [-.56,-.36,-.16,.10,.53,.78,.98]
REGISTER_SCAN = [-.485,-.325,-.147,.10,.53,.78,.93]


def smooth(value, low, high):
    t=np.clip((value-low)/(high-low),0,1)
    return t*t*(3-2*t)


def normalized(points):
    return points/np.maximum(np.linalg.norm(points,axis=1,keepdims=True),1e-10)


def bilinear(image, x, y):
    x=np.clip(x,0,image.shape[1]-1-1e-7)
    y=np.clip(y,0,image.shape[0]-1-1e-7)
    i=x.astype(int)
    j=y.astype(int)
    a=(x-i)
    b=(y-j)
    if image.ndim==3:
        a=a[:,None]
        b=b[:,None]
    return ((1-a)*image[j,i]+a*image[j,i+1])*(1-b)+((1-a)*image[j+1,i]+a*image[j+1,i+1])*b


def read_file(folder, name, width, dtype='<f4'):
    return np.fromfile(folder/(name+'.bin'),dtype=dtype).reshape(-1,width)


@dataclass
class RadialScan:
    levels: np.ndarray
    centers: np.ndarray
    radius: np.ndarray
    colors: np.ndarray | None
    valid: np.ndarray

    def coordinates(self, points):
        s,u,z=points.T
        center=np.column_stack([np.interp(s,self.levels,self.centers[:,i]) for i in range(2)])
        delta=np.column_stack([u,z])-center
        return np.mod(np.arctan2(delta[:,1],delta[:,0]),TAU),np.linalg.norm(delta,axis=1)

    def sample(self, field, s, angle):
        limits=self.levels
        x=np.mod(angle,TAU)*self.radius.shape[1]/TAU
        y=(s-limits[0])/(limits[-1]-limits[0])*(len(limits)-1)
        wrap=np.concatenate([field,field[:,:1]],axis=1)
        return bilinear(wrap,x,y)

    def map_point(self, s, angle, radius):
        center=np.column_stack([np.interp(s,self.levels,self.centers[:,i]) for i in range(2)])
        plane=center+radius[:,None]*np.column_stack([np.cos(angle),np.sin(angle)])
        return np.column_stack([s,plane])@FRAME.T


def scan_sections(coords, faces, angle_count, level_count, uv=None, texture=None):
    """Intersect each triangular cross-section with radial rays. The far hit follows
    the outside edge of the folded plumage, including exposed UV islands."""
    lo,hi=float(coords[:,0].min())+.0002,float(coords[:,0].max())-.0002
    levels=np.linspace(lo,hi,level_count)
    triangles=coords[faces]
    tex_tri=uv[faces] if uv is not None else None
    low=triangles[:,:,0].min(axis=1)
    high=triangles[:,:,0].max(axis=1)
    segments=[]
    centers=[]
    aidx=np.array([0,1,2])
    bidx=np.array([1,2,0])
    for height in levels:
        ids=np.flatnonzero((low<height)&(high>=height))
        t=triangles[ids]
        a,b=t[:,aidx],t[:,bidx]
        e1,e2=np.nonzero((a[:,:,0]<height)!=(b[:,:,0]<height))
        start,end=a[e1,e2],b[e1,e2]
        mix=(height-start[:,0])/(end[:,0]-start[:,0])
        segment=(start[:,1:]+mix[:,None]*(end[:,1:]-start[:,1:])).reshape(-1,2,2)
        if not len(segment):
            raise ValueError('Empty radial section')
        tex=None
        if tex_tri is not None:
            ta,tb=tex_tri[ids[e1],aidx[e2]],tex_tri[ids[e1],bidx[e2]]
            tex=(ta+mix[:,None]*(tb-ta)).reshape(-1,2,2)
        segments.append((segment,tex))
        centers.append((segment.min(axis=(0,1))+segment.max(axis=(0,1)))*.5)
    centers=ndimage.gaussian_filter1d(np.array(centers),2.5,axis=0,mode='nearest')
    theta=np.arange(angle_count)*TAU/angle_count
    dx,dy=np.cos(theta)[:,None],np.sin(theta)[:,None]
    r=np.zeros((level_count,angle_count),np.float32)
    color=np.zeros((level_count,angle_count,3),np.float32) if texture is not None else None
    for row,(segment,tex) in enumerate(segments):
        ax,ay=(segment[:,0]-centers[row]).T
        bx,by=(segment[:,1]-segment[:,0]).T
        cross=dx*by-dy*bx
        good=np.abs(cross)>1e-10
        denom=np.where(good,cross,1)
        distance=(ax*by-ay*bx)/denom
        fraction=(ax*dy-ay*dx)/denom
        hits=good&(distance>0)&(fraction>=-1e-6)&(fraction<=1+1e-6)
        distance=np.where(hits,distance,0)
        indices=np.argmax(distance,axis=1)
        indexer=np.arange(angle_count),indices
        r[row]=distance[indexer]
        if color is not None:
            frac=np.clip(fraction[indexer],0,1)
            a=tex[indices,0]
            puv=a+frac[:,None]*(tex[indices,1]-a)
            color[row]=bilinear(texture,puv[:,0]*texture.shape[1]-.5,puv[:,1]*texture.shape[0]-.5)
    valid=r>0
    tripled=np.concatenate([valid,valid,valid],axis=1)
    nearest=ndimage.distance_transform_edt(~tripled,return_distances=False,return_indices=True)
    iy=nearest[0,:,angle_count:2*angle_count]
    ix=nearest[1,:,angle_count:2*angle_count]%angle_count
    r=r[iy,ix]
    if color is not None:
        color=color[iy,ix]
    radius=ndimage.gaussian_filter(r,(2.4,2.6),mode=('nearest','wrap'))
    return RadialScan(levels,centers,radius,color,valid.astype(np.float32))


def geometry_transfer(folder, world, neutral, bind_normal, previous_normal,
                      triangles, joints, weights, transforms, shared, donor):
    coords=world@FRAME
    axial=coords[:,0]
    scan_s=np.interp(axial,REGISTER_SOURCE,REGISTER_SCAN)
    angle,length=shared.coordinates(coords)
    original=shared.sample(shared.radius,axial,angle)
    profile=donor.sample(donor.radius,scan_s,angle)
    ratio=length/np.maximum(.022,original)
    # Smoothly limit edge-on primaries that overshoot between sampled sections.
    relative=np.where(ratio>1,1+.072*np.tanh((ratio-1)/.072),ratio)
    target=donor.map_point(scan_s,angle,profile*relative)
    head=np.sum((joints==21)*weights,axis=1)
    leg=np.sum(np.isin(joints,[7,8,9,14,15,16])*weights,axis=1)
    tail=np.sum((joints==22)*weights,axis=1)
    folded_tail=smooth(tail,.36,.88)*smooth(-neutral[:,0],.397,.560)
    travel=np.clip((-neutral[:,0]-.393)/.266,0,1)
    rest_height=.389-.208*travel
    tail_profile=np.column_stack([
        -.503-.311*travel,
        .304-.131*travel+.23*np.clip(neutral[:,1]-rest_height,-.11,.13),
        neutral[:,2]*(.58-.32*travel)
    ])
    target+=(tail_profile-target)*folded_tail[:,None]
    # Preserve the sculpted face, separate eyes and the leg attachment cuffs.
    # Transfer the entire mantle profile, including the long trailing feathers.
    strength=(1-smooth(axial,.60,.785))*(1-.98*head*smooth(neutral[:,0],.33,.48))
    strength*=1-.91*leg*(1-smooth(world[:,1],.16,.35))
    diff=(target-world)*strength[:,None]
    diff*=np.minimum(1,.240/np.maximum(np.linalg.norm(diff,axis=1),1e-9))[:,None]

    # Weld UV splits for displacement smoothing so a texture seam stays closed.
    points,pairs,index=np.unique(np.round(world,5),axis=0,return_index=True,return_inverse=True)
    welded=index[triangles]
    edges=np.concatenate([welded[:,[0,1]],welded[:,[1,2]],welded[:,[2,0]]])
    edges=np.unique(np.concatenate([edges,edges[:,::-1]]),axis=0)
    graph=coo_matrix((np.ones(len(edges)),(edges[:,0],edges[:,1])),shape=(len(points),len(points))).tocsr()
    deg=np.maximum(1,np.asarray(graph.sum(axis=1)).ravel())
    flows=diff[pairs].copy()
    for _ in range(5):
        flows=.56*flows+.44*(graph@flows)/deg[:,None]
    diff=flows[index]
    diff*=np.minimum(1,.250/np.maximum(np.linalg.norm(diff,axis=1),1e-10))[:,None]
    diff[:,1]=np.maximum(diff[:,1],.067-world[:,1])
    target=world+diff

    # Fit local morph deltas through the existing closed-pose skinning transform.
    invertible=np.abs(np.linalg.det(transforms))>.0002
    inverse=np.zeros_like(transforms)
    inverse[invertible]=np.linalg.inv(transforms[invertible])
    result=np.einsum('nij,nj->ni',inverse,diff)
    result.astype('<f4').tofile(folder/'standing-scan-position.bin')

    before=bind_normal+previous_normal
    old_world=normalized(np.einsum('nij,nj->ni',transforms,before))
    shading_keys=np.column_stack([np.round(world,5),np.round(old_world*5)])
    _,shade_index=np.unique(shading_keys,axis=0,return_inverse=True)
    tri=target[triangles]
    n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
    accum=np.zeros((shade_index.max()+1,3))
    for corner in range(3):
        np.add.at(accum,shade_index[triangles[:,corner]],n)
    normal=normalized(accum[shade_index])
    flat_agreement=np.sum(normal*old_world,axis=1)
    amount=.82*smooth(np.linalg.norm(diff,axis=1),.007,.054)*smooth(flat_agreement,-.55,.30)
    desired=normalized(old_world*(1-amount[:,None])+normal*amount[:,None])
    corrected=normalized(np.einsum('nij,nj->ni',inverse,desired))
    corrected=corrected*np.linalg.norm(before,axis=1,keepdims=True)-before
    corrected[~invertible]=0
    corrected[amount<1e-3]=0
    corrected.astype('<f4').tofile(folder/'standing-scan-normal.bin')
    target.astype('<f4').tofile(folder/'standing-scan-posed.bin')
    print('Standing surface entries:',len(result),'source and target maxima of width',
          float(np.max(np.abs(world[:,2]))),float(np.max(np.abs(target[:,2]))),flush=True)


def raster_owners(uv, triangles, width, height, priority):
    owner=np.full((height,width),-1,np.int32)
    priorities=np.full((height,width),-1,np.float32)
    weights=np.zeros((height,width,2),np.float32)
    coords=uv[triangles]*[width,height]
    low=np.maximum(0,np.floor(coords.min(axis=1))).astype(int)
    high=np.minimum([width-1,height-1],np.ceil(coords.max(axis=1))).astype(int)
    for i,((x0,y0),(x1,y1),(x2,y2)) in enumerate(coords):
        lx,ly=low[i]
        hx,hy=high[i]
        den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
        if abs(den)<.0001 or lx>hx or ly>hy:
            continue
        px=np.arange(lx,hx+1)[None,:]+.5-x2
        py=np.arange(ly,hy+1)[:,None]+.5-y2
        a=((y1-y2)*px+(x2-x1)*py)/den
        b=((y2-y0)*px+(x0-x2)*py)/den
        eligible=(a>-.003)&(b>-.003)&(a+b<1.003)
        view=np.s_[ly:hy+1,lx:hx+1]
        expected=priority[i]
        write=eligible&(priorities[view]<expected)
        priorities[view][write]=expected
        owner[view][write]=i
        weights[view][write]=np.column_stack([a[write],b[write]])
    return owner,weights


def bake_plumage(folder, source_uv, faces, posed, neutral, joint_ids, skinned_weights, shared, donor):
    source=np.asarray(Image.open(folder/'source-base.jpg').convert('RGB'),dtype=np.float32)/255
    normal=np.asarray(Image.open(folder/'source-normal.jpg').convert('RGB'),dtype=np.float32)/255
    inner_source=neutral[:,0]
    face_mask=np.mean((1-smooth(inner_source,.465,.54))[faces],axis=1)
    height,width=source.shape[:2]
    owner,bary=raster_owners(source_uv,faces,width,height,face_mask)
    sampled=np.zeros((height,width),np.float32)
    mixmap=np.zeros((height,width),np.float32)
    paint=source.copy()
    y,x=np.nonzero(owner>=0)
    wing_ids=[1,2,3,4,5,6]
    wing=np.sum(np.isin(joint_ids,wing_ids)*skinned_weights,axis=1)
    tail=np.sum((joint_ids==22)*skinned_weights,axis=1)

    for start in range(0,len(y),64000):
        row=y[start:start+64000]
        col=x[start:start+64000]
        corners=faces[owner[row,col]]
        factors=bary[row,col]
        factors=np.column_stack([factors,1-factors.sum(axis=1)])
        p=np.einsum('ni,nij->nj',factors,posed[corners])
        ref=np.einsum('ni,nij->nj',factors,neutral[corners])
        spoke=p@FRAME
        axial=spoke[:,0]
        theta,radius=shared.coordinates(spoke)
        scan_s=np.interp(axial,REGISTER_SOURCE,REGISTER_SCAN)
        photo=donor.sample(donor.colors,scan_s,theta)
        conf=donor.sample(donor.valid,scan_s,theta)
        boundary=shared.sample(shared.radius,axial,theta)
        relative=radius/np.maximum(.025,boundary)
        wings=np.einsum('ni,ni->n',factors,wing[corners])
        tail_weights=np.einsum('ni,ni->n',factors,tail[corners])
        rgb=source[row,col]
        old_lum=rgb@[.2126,.7152,.0722]
        photo_lum=photo@[.2126,.7152,.0722]
        face=1-smooth(ref[:,0],.421,.516)
        # Preserve extended primary structure and the white tail while carrying
        # the donor's true feather pattern on the mantle, neck and closed wings.
        strength=.97*face*(.66+.34*smooth(conf,.08,.95))
        strength*=1-.41*wings*smooth(np.abs(ref[:,2]),.88,1.79)
        strength*=1-.66*tail_weights
        strength*=.81+.19*smooth(relative,.50,.89)
        bright=smooth(old_lum,.67,.91)
        strength*=1-.65*bright*(1-smooth(photo_lum,.50,.73))
        strength*=1-.23*(1-smooth(old_lum,.40,.69))*smooth(photo_lum,.63,.90)
        blend=rgb+(photo-rgb)*strength[:,None]
        under_rump=smooth(-ref[:,0],.196,.279)*(1-smooth(ref[:,1],.417,.487))
        under_rump*=1-smooth(np.abs(ref[:,2]),.282,.438)
        bright_patch=smooth(blend@[.2126,.7152,.0722],.34,.52)
        coverts=np.maximum(smooth(tail_weights,.10,.58)*smooth(-ref[:,0],.265,.368),
                           under_rump*bright_patch)
        cover_color=np.array([.236,.181,.145])+np.clip((photo_lum-.32)*.23,-.059,.13)[:,None]
        paint[row,col]=blend+(cover_color-blend)*coverts[:,None]
        sampled[row,col]=photo_lum
        mixmap[row,col]=strength

    inside=owner>=0
    dist,nearest=ndimage.distance_transform_edt(~inside,return_distances=True,return_indices=True)
    pad=(dist>0)&(dist<4)
    ry,rx=nearest[0][pad],nearest[1][pad]
    paint[pad]=paint[ry,rx]
    sampled[pad]=sampled[ry,rx]
    mixmap[pad]=mixmap[ry,rx]
    out=np.clip(paint*255+.5,0,255).astype(np.uint8)
    Image.fromarray(out).save(folder/'shared-feather-color.jpg',quality=93,subsampling=0,optimize=True)

    # The input normal already represents the flight-feather relief. Add only
    # small gradients from transferred texture in the destination UV basis.
    if normal.shape != source.shape:
        normal=np.asarray(Image.fromarray((255*normal).astype(np.uint8)).resize((width,height),Image.Resampling.BILINEAR),dtype=np.float32)/255
    soft=ndimage.gaussian_filter(sampled,2.0)
    high=ndimage.gaussian_filter(sampled,.65)-soft
    dv,du=np.gradient(high)
    strength=1.20*mixmap*smooth(~ndimage.binary_dilation(~inside,iterations=2),0,1)
    n=normal*2-1
    n[:,:,0]-=np.clip(du*strength,-.24,.24)
    n[:,:,1]+=np.clip(dv*strength,-.24,.24)
    n/=np.maximum(np.linalg.norm(n,axis=2,keepdims=True),.01)
    Image.fromarray(np.clip((n+.999)*127.5+.5,0,255).astype(np.uint8)).save(
        folder/'shared-feather-normal.jpg',quality=91,subsampling=0,optimize=True)
    print('Painted UV pixels:',len(y),'mean mixture',float(np.mean(mixmap[inside])),flush=True)


def bake_rectrices(folder, donor):
    height,width=512,256
    cross,travel=np.meshgrid(np.linspace(-1,1,width),np.linspace(0,1,height))
    s=-.238-.213*travel
    theta=(cross*.80+.25*np.sin(np.pi*travel))%TAU
    photo=donor.sample(donor.colors,s.ravel(),theta.ravel()).reshape(height,width,3)
    luminance=photo@[.2126,.7152,.0722]
    detail=luminance-ndimage.gaussian_filter(luminance,2.35)
    texture=.733+.136*luminance+.26*detail
    texture+=.033*np.exp(-(cross/.032)**2)*(1-.59*travel)
    texture-=.031*smooth(np.abs(cross),.74,1)+.016*smooth(travel,.82,1)
    color=np.clip(texture[:,:,None]+[.011,.002,-.018],.51,.925)
    opening=smooth(travel,.04,.35)[:,:,None]
    shadow=np.array([.330,.289,.243])
    color=shadow+(color-shadow)*opening
    Image.fromarray((color*255+.5).astype(np.uint8)).save(
        folder/'rectrix-pigment.jpg',quality=90,subsampling=0,optimize=True)


def main(folder, geometry_only=False):
    neutral=read_file(folder,'source-position',3)
    posed=read_file(folder,'source-closed',3)
    triangles=read_file(folder,'source-index',3,'<u4')
    source_uv=read_file(folder,'source-uv',2)
    bind_normal=read_file(folder,'source-normal',3)
    prev_normal=read_file(folder,'source-fold-normals',3)
    joints=read_file(folder,'source-joints',4,'u1')
    weights=read_file(folder,'source-weights',4)
    transforms=read_file(folder,'source-closed-transform',9).reshape(-1,3,3).transpose(0,2,1)
    scan=read_file(folder,'donor-position',3)*[.88,.80,.86]+[-.322,.002,0]
    donor_faces=read_file(folder,'donor-index',3,'<u4')
    donor_uv=read_file(folder,'donor-uv',2)
    color=None if geometry_only else np.asarray(Image.open(folder/'donor-base.jpg').convert('RGB'),dtype=np.float32)/255
    shared=scan_sections(posed@FRAME,triangles,280,230)
    print('Shared surface cross-sections ready',flush=True)
    donor=scan_sections(scan@FRAME,donor_faces,640,468,donor_uv,color)
    print('Standing donor cross-sections ready',flush=True)
    geometry_transfer(folder,posed,neutral,bind_normal,prev_normal,triangles,joints,weights,transforms,shared,donor)
    if not geometry_only:
        bake_plumage(folder,source_uv,triangles,posed,neutral,joints,weights,shared,donor)
        bake_rectrices(folder,donor)


if __name__=='__main__':
    main(Path(sys.argv[1]),'--geometry-only' in sys.argv[2:])
