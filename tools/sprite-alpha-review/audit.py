"""Read-only pixel QA for non-interlaced RGBA8 PNG sprite grids."""
from hashlib import sha256
from pathlib import Path
import argparse
import json
import struct
import zlib

SIGNATURE = b'\x89PNG\r\n\x1a\n'
MAX_BYTES = 24 * 1024 * 1024
MAX_PIXELS = 4 * 1024 * 1024
MAX_CHUNKS = 8192


def paeth(a, b, c):
    p = a+b-c
    pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
    return a if pa <= pb and pa <= pc else b if pb <= pc else c


def channels(blob):
    if len(blob) > MAX_BYTES or not blob.startswith(SIGNATURE):
        raise ValueError('Expected a bounded PNG')
    offset, header, compressed, idat_closed, ended = 8, None, [], False, False
    chunks = 0
    while offset < len(blob):
        chunks += 1
        if chunks > MAX_CHUNKS:
            raise ValueError('Too many PNG chunks')
        if offset+12 > len(blob):
            raise ValueError('Truncated chunk')
        n, key = struct.unpack_from('>I4s', blob, offset)
        if not key.isalpha() or key[2] & 32:
            raise ValueError('Invalid PNG chunk type')
        if n > MAX_BYTES or offset+12+n > len(blob):
            raise ValueError('Invalid chunk length')
        data = blob[offset+8:offset+8+n]
        crc = struct.unpack_from('>I', blob, offset+8+n)[0]
        if zlib.crc32(data, zlib.crc32(key)) != crc:
            raise ValueError('Chunk checksum does not match')
        offset += n+12
        if key == b'IHDR':
            if header is not None or offset != 33 or n != 13:
                raise ValueError('Missing or duplicate PNG header')
            w,h,depth,mode,compression,filter_method,interlace = struct.unpack('>IIBBBBB', data)
            if (depth,mode,compression,filter_method,interlace) != (8,6,0,0,0) or not (0<w<=4096 and 0<h<=4096 and w*h<=MAX_PIXELS):
                raise ValueError('Only bounded non-interlaced RGBA8 PNG is supported')
            header = w,h
        elif header is None:
            raise ValueError('Missing PNG header')
        elif key in (b'acTL', b'fcTL', b'fdAT', b'tRNS'):
            raise ValueError('Animation and alternative transparency are not supported')
        elif key == b'IDAT':
            if idat_closed:
                raise ValueError('Image data must be contiguous')
            compressed.append(data)
            if len(compressed) > 4096:
                raise ValueError('Too many image data chunks')
        elif key == b'IEND':
            if n or offset != len(blob) or not compressed:
                raise ValueError('Invalid image termination')
            ended = True
            break
        else:
            if key not in (b'PLTE',) and not key[0] & 32:
                raise ValueError('Unknown critical PNG chunk')
            idat_closed = idat_closed or bool(compressed)
    if not ended:
        raise ValueError('Incomplete PNG')
    w, h = header
    stride = 4*w
    target = (stride+1)*h
    stream = zlib.decompressobj()
    try:
        scan = stream.decompress(b''.join(compressed), target+1)
    except zlib.error as err:
        raise ValueError('Malformed image compression') from err
    if len(scan) != target or not stream.eof or stream.unconsumed_tail or stream.unused_data:
        raise ValueError('Compressed data size does not match the header')
    rows = []
    prior = bytes(stride)
    for start in range(0, len(scan), stride+1):
        method = scan[start]
        row = bytearray(scan[start+1:start+1+stride])
        if method > 4:
            raise ValueError('Unknown scanline filter')
        if method:
            for i in range(stride):
                left = row[i-4] if i >= 4 else 0
                up = prior[i]
                corner = prior[i-4] if i >= 4 else 0
                predictor = (left if method == 1 else up if method == 2 else
                             (left+up)//2 if method == 3 else paeth(left,up,corner))
                row[i] = (row[i]+predictor)&255
        rows.append(row)
        prior = row
    return w,h,rows


def audit(blob, cols, lines, gutter=1, halo=8, uneven=False):
    if not 1 <= cols <= 64 or not 1 <= lines <= 64 or cols*lines > 256:
        raise ValueError('Grid exceeds 256 frames')
    if not 0 <= gutter <= 32 or not 0 <= halo <= 254:
        raise ValueError('Invalid gutter or alpha threshold')
    w,h,rows = channels(blob)
    exact = w % cols == 0 and h % lines == 0
    if not exact and not uneven:
        raise ValueError('Dimensions do not divide into the selected grid; provide approved dimensions or use explicit --estimate uneven boundaries')
    if w//cols <= 2*gutter or h//lines <= 2*gutter:
        raise ValueError('Gutter would consume a complete frame')
    rects=[]
    for fy in range(lines):
        y0,y1 = fy*h//lines,(fy+1)*h//lines
        for fx in range(cols):
            x0,x1 = fx*w//cols,(fx+1)*w//cols
            rects.append((f'row-{fy+1}-col-{fx+1}', x0,y0,x1,y1))
    frames = inspect_rects(rows, rects, gutter, halo)
    return {'schema':'athena-sprite-alpha-audit-v1','sha256':sha256(blob).hexdigest(),
        'size':[w,h],'grid':[cols,lines],'equal_grid':exact,'geometry_estimate':not exact,
        'gutter_px':gutter,'low_alpha_upper_bound':halo,'frames':frames,
        'scope':'Read-only source pixels. Gutter warnings and low alpha can be intentional. No rendering, timing, rightsholder, identity, or exported-animation acceptance.'}


def inspect_rects(rows, rects, gutter, halo):
    frames, seen = [], {}
    for tile,x0,y0,x1,y1 in rects:
        left, top, right, bottom = x1,y1,-1,-1
        occupied = low = border = hidden_rgb = 0
        fingerprint=sha256(struct.pack('>II',x1-x0,y1-y0))
        for y in range(y0,y1):
            row = rows[y]
            visible = bytearray(row[4*x0:4*x1])
            for x in range(x0,x1):
                p=4*x
                a=row[p+3]
                if a:
                    occupied += 1
                    low += a <= halo
                    left,top,right,bottom=min(left,x),min(top,y),max(right,x),max(bottom,y)
                    border += min(x-x0,x1-1-x,y-y0,y1-1-y) < gutter
                elif row[p] or row[p+1] or row[p+2]:
                    hidden_rgb += 1
                    q=4*(x-x0)
                    visible[q:q+3]=b'\0\0\0'
            fingerprint.update(visible)
        fpr=fingerprint.hexdigest()
        frames.append({'tile':tile,'rect':[x0,y0,x1-x0,y1-y0],
            'visible_bbox':None if not occupied else [left-x0,top-y0,right-left+1,bottom-top+1],
            'occupied_pixels':occupied,'low_alpha_pixels':low,'nonzero_gutter_pixels':border,
            'rgb_under_zero_alpha_pixels':hidden_rgb,'visual_duplicate_of':seen.get(fpr)})
        seen.setdefault(fpr,tile)
    return frames


def audit_manifest(blob, raw, gutter=0, halo=8, min_gap=0):
    if not 0 <= gutter <= 32 or not 0 <= halo <= 254 or not 0 <= min_gap <= 64:
        raise ValueError('Invalid gutter, alpha threshold or geometric gap')
    if len(raw) > 65536:
        raise ValueError('Frame manifest exceeds 64 KiB')
    def strict(pairs):
        out = {}
        for key, value in pairs:
            if key in out:
                raise ValueError('Duplicate manifest key')
            out[key] = value
        return out
    manifest = json.loads(raw.decode('utf-8'), object_pairs_hook=strict)
    if not isinstance(manifest, dict) or set(manifest) != {'schema','source_sha256','frames'} or manifest['schema'] != 'athena-sprite-frames-v1':
        raise ValueError('Unsupported frame manifest')
    digest = sha256(blob).hexdigest()
    if manifest['source_sha256'] != digest:
        raise ValueError('Manifest does not name these exact PNG bytes')
    w,h,rows = channels(blob)
    rects, times = [], []
    frames = manifest['frames']
    if not isinstance(frames,list) or not 1 <= len(frames) <= 256:
        raise ValueError('Expected 1 to 256 authored frame rectangles')
    for i,item in enumerate(frames,1):
        if not isinstance(item,dict) or set(item) != {'x','y','width','height','duration_ms'} or any(type(v) is not int for v in item.values()):
            raise ValueError('Every rectangle must contain integer x, y, width, height and duration_ms')
        x,y,fw,fh,dur=(item[k] for k in ('x','y','width','height','duration_ms'))
        if x<0 or y<0 or fw<=2*gutter or fh<=2*gutter or x+fw>w or y+fh>h or not 1<=dur<=60000:
            raise ValueError(f'Frame {i} lies outside PNG bounds, has no inner rectangle, or has unsupported timing')
        for _,a,b,c,d in rects:
            dx=max(a-x-fw,x-c)
            dy=max(b-y-fh,y-d)
            if dx<0 and dy<0:
                raise ValueError(f'Frame {i} overlaps another authored frame')
            if max(dx,dy)<min_gap:
                raise ValueError(f'Frame {i} has less than the requested geometric gap')
        rects.append((f'frame-{i}',x,y,x+fw,y+fh))
        times.append(dur)
    measured=inspect_rects(rows,rects,gutter,halo)
    for frame,dur in zip(measured,times):
        frame['duration_ms']=dur
    return {'schema':'athena-sprite-manifest-audit-v1','sha256':digest,'manifest_sha256':sha256(raw).hexdigest(),'size':[w,h],
        'frame_count':len(measured),'duration_ms':sum(times),'manifest_geometry':True,'gutter_px':gutter,'min_geometric_gap_px':min_gap,
        'low_alpha_upper_bound':halo,'frames':measured,
        'scope':'Verified declared rectangles and timing data, not editor or runtime behavior. Geometric gap is not pixel padding. No source pixels edited.'}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('png',type=Path)
    p.add_argument('--cols',type=int)
    p.add_argument('--rows',type=int)
    p.add_argument('--manifest',type=Path,help='explicit authored frame rectangles pinned to the exact PNG')
    p.add_argument('--gutter',type=int)
    p.add_argument('--min-gap',type=int,default=0,help='minimum geometric gap in manifest mode only')
    p.add_argument('--low-alpha',type=int,default=8)
    p.add_argument('--estimate',action='store_true',help='allow explicit, non-authoritative uneven grid estimation')
    a=p.parse_args()
    try:
        with a.png.open('rb') as source:
            blob=source.read(MAX_BYTES+1)
        if a.manifest:
            if a.cols is not None or a.rows is not None or a.estimate:
                raise ValueError('Choose explicit manifest or grid, not both')
            with a.manifest.open('rb') as source:
                value=audit_manifest(blob,source.read(65537),0 if a.gutter is None else a.gutter,a.low_alpha,a.min_gap)
        else:
            if a.cols is None or a.rows is None or a.min_gap:
                raise ValueError('Choose --cols and --rows, or one --manifest')
            value=audit(blob,a.cols,a.rows,1 if a.gutter is None else a.gutter,a.low_alpha,a.estimate)
        print(json.dumps(value,indent=2))
    except (OSError,ValueError) as err:
        p.error(str(err) if isinstance(err,ValueError) else 'Could not read the selected PNG')


if __name__=='__main__':
    main()
