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
    frames, seen = [], {}
    for fy in range(lines):
        y0,y1 = fy*h//lines,(fy+1)*h//lines
        for fx in range(cols):
            x0,x1 = fx*w//cols,(fx+1)*w//cols
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
            tile=f'row-{fy+1}-col-{fx+1}'
            fpr=fingerprint.hexdigest()
            frames.append({'tile':tile,'rect':[x0,y0,x1-x0,y1-y0],
                'visible_bbox':None if not occupied else [left-x0,top-y0,right-left+1,bottom-top+1],
                'occupied_pixels':occupied,'low_alpha_pixels':low,'nonzero_gutter_pixels':border,
                'rgb_under_zero_alpha_pixels':hidden_rgb,'visual_duplicate_of':seen.get(fpr)})
            seen.setdefault(fpr,tile)
    return {'schema':'athena-sprite-alpha-audit-v1','sha256':sha256(blob).hexdigest(),
        'size':[w,h],'grid':[cols,lines],'equal_grid':exact,'geometry_estimate':not exact,
        'gutter_px':gutter,'low_alpha_upper_bound':halo,'frames':frames,
        'scope':'Read-only source pixels. Gutter warnings and low alpha can be intentional. No rendering, timing, rightsholder, identity, or exported-animation acceptance.'}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('png',type=Path)
    p.add_argument('--cols',type=int,required=True)
    p.add_argument('--rows',type=int,required=True)
    p.add_argument('--gutter',type=int,default=1)
    p.add_argument('--low-alpha',type=int,default=8)
    p.add_argument('--estimate',action='store_true',help='allow explicit, non-authoritative uneven grid estimation')
    a=p.parse_args()
    try:
        with a.png.open('rb') as source:
            blob=source.read(MAX_BYTES+1)
        print(json.dumps(audit(blob,a.cols,a.rows,a.gutter,a.low_alpha,a.estimate),indent=2))
    except (OSError,ValueError) as err:
        p.error(str(err) if isinstance(err,ValueError) else 'Could not read the selected PNG')


if __name__=='__main__':
    main()
