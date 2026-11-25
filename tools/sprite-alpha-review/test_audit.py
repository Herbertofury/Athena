import struct
import json
from hashlib import sha256
import unittest
import zlib
from audit import audit, audit_manifest, channels, paeth, SIGNATURE


def chunk(kind, data):
    return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data))


def png(rows, mode=0, apng=False):
    w,h=len(rows[0])//4,len(rows)
    last=bytes(w*4)
    scan=bytearray()
    for row in rows:
        scan.append(mode)
        for i,val in enumerate(row):
            left=row[i-4] if i>=4 else 0
            up=last[i]
            corner=last[i-4] if i>=4 else 0
            pred=(0,left,up,(left+up)//2,paeth(left,up,corner))[mode]
            scan.append((val-pred)&255)
        last=row
    return (SIGNATURE+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))
            +(chunk(b'acTL',struct.pack('>II',1,0)) if apng else b'')
            +chunk(b'IDAT',zlib.compress(scan))+chunk(b'IEND',b''))


class ReadOnlyRGBA(unittest.TestCase):
    def test_all_five_standard_filters_preserve_every_byte(self):
        rows=[bytes((i*3+offset*71)%256 for i in range(24)) for offset in range(8)]
        for method in range(5):
            self.assertEqual(channels(png(rows,method)),(6,8,rows))

    def test_alpha_categories_and_visual_duplicate_do_not_remove_hidden_rgb(self):
        w,h=8,4
        data=[bytearray(w*4) for _ in range(h)]
        # Same two equal-size frames; one fully transparent pixel retains color.
        data[0][0:4]=b'\x33\x44\x55\x00'
        for x in [1,5]:
            data[1][x*4:x*4+4]=b'\xaa\x09\x11\xff'
        artifact=png(data)
        a=audit(artifact,2,1)
        first,second=a['frames']
        self.assertEqual(first['rgb_under_zero_alpha_pixels'],1)
        self.assertEqual(first['nonzero_gutter_pixels'],0)
        self.assertEqual(second['visual_duplicate_of'],'row-1-col-1')
        self.assertEqual(first['visible_bbox'],[1,1,1,1])
        self.assertEqual(channels(artifact)[2][0][0],0x33)

    def test_low_alpha_border_and_uneven_geometry_are_separate(self):
        rows=[bytearray(9*4) for _ in range(5)]
        rows[0][0:4]=b'\x01\x20\x40\x05'
        artifact=png(rows)
        with self.assertRaisesRegex(ValueError,'do not divide'):
            audit(artifact,2,1)
        result=audit(artifact,2,1,uneven=True)
        self.assertTrue(result['geometry_estimate'])
        self.assertEqual(result['frames'][0]['low_alpha_pixels'],1)
        self.assertEqual(result['frames'][0]['nonzero_gutter_pixels'],1)

    def test_bad_crc_trailing_bytes_and_apng_rejected(self):
        rows=[bytes(16)]*4
        fixed=png(rows)
        bad=bytearray(fixed)
        bad[30]^=1
        for image in [bytes(bad),fixed+b'x',png(rows,apng=True)]:
            with self.assertRaises(ValueError):
                channels(image)

    def test_compressed_upper_bound_and_unsupported_depth(self):
        big=SIGNATURE+chunk(b'IHDR',struct.pack('>IIBBBBB',3,3,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(1<<20)))+chunk(b'IEND',b'')
        with self.assertRaises(ValueError):
            channels(big)
        other=SIGNATURE+chunk(b'IHDR',struct.pack('>IIBBBBB',3,3,16,6,0,0,0))+chunk(b'IDAT',b'x')+chunk(b'IEND',b'')
        with self.assertRaises(ValueError):
            channels(other)

    def test_authored_manifest_preserves_original_order_and_timing(self):
        rows=[bytearray(12*4) for _ in range(6)]
        rows[2][(12*0+2)*4+3]=255
        rows[1][(12*0+9)*4+3]=8
        image=png(rows)
        meta={'schema':'athena-sprite-frames-v1','source_sha256':sha256(image).hexdigest(),'frames':[
            {'x':7,'y':0,'width':4,'height':4,'duration_ms':75},
            {'x':0,'y':1,'width':4,'height':4,'duration_ms':180}]}
        raw=json.dumps(meta).encode()
        result=audit_manifest(image,raw,gutter=1,min_gap=2)
        self.assertEqual(result['duration_ms'],255)
        self.assertEqual([f['duration_ms'] for f in result['frames']],[75,180])
        self.assertEqual(result['frames'][0]['rect'],[7,0,4,4])
        self.assertEqual(result['frames'][0]['low_alpha_pixels'],1)
        self.assertEqual(result['frames'][1]['nonzero_gutter_pixels'],0)
        self.assertEqual(result['manifest_sha256'],sha256(raw).hexdigest())

    def test_manifest_rejects_wrong_png_overlap_short_gap_and_extra_keys(self):
        image=png([bytes(12*4)]*6)
        a={'x':0,'y':0,'width':4,'height':4,'duration_ms':20}
        b={'x':6,'y':0,'width':5,'height':5,'duration_ms':90}
        meta={'schema':'athena-sprite-frames-v1','source_sha256':sha256(image).hexdigest(),'frames':[a,b]}
        self.assertEqual(audit_manifest(image,json.dumps(meta).encode(),min_gap=2)['frame_count'],2)
        for newer,hint in [
            (dict(meta,source_sha256='0'*64),'exact PNG'),
            (dict(meta,frames=[a,dict(b,x=2)]),'overlaps'),
            (dict(meta,frames=[a,dict(b,x=5)]),'geometric gap'),
            (dict(meta,frames=[a,dict(b,width=12)]),'outside PNG bounds'),
            (dict(meta,frames=[a,dict(b,duration_ms=True)]),'integer'),
            (dict(meta,extra=True),'Unsupported')
        ]:
            with self.assertRaisesRegex(ValueError,hint):
                audit_manifest(image,json.dumps(newer).encode(),min_gap=2)


if __name__=='__main__':
    unittest.main()
