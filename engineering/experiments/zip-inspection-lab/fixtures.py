"""Owned, deterministic generated fixtures. No user archives or bundled code."""
import io
import stat
import struct
import warnings
import zipfile
import zlib


def archive(rows,*,comment=b''):
    stream=io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter('ignore',UserWarning)  # Deliberate duplicate-name controls.
        with zipfile.ZipFile(stream,'w') as output:
            for name,body,method in rows:
                info=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0));info.create_system=3
                info.external_attr=((stat.S_IFDIR|0o700)<<16|0x10) if name.endswith('/') else ((stat.S_IFREG|0o600)<<16)
                output.writestr(info,body,compress_type=method)
            output.comment=comment
    return stream.getvalue()


def single_raw(name=b'mod.bin',body=b'generated',*,compressed=None,declared=None,crc=None,flags=0,method=8):
    if compressed is None:
        if method==0:compressed=body
        else:
            compressor=zlib.compressobj(wbits=-15);compressed=compressor.compress(body)+compressor.flush()
    declared=len(body) if declared is None else declared
    crc=zlib.crc32(body) if crc is None else crc
    local=struct.pack('<4s5H3I2H',b'PK\x03\x04',20,flags,method,0,33,crc,len(compressed),declared,len(name),0)+name+compressed
    central=struct.pack('<4s6H3I5H2I',b'PK\x01\x02',3*256+20,20,flags,method,0,33,crc,len(compressed),declared,len(name),0,0,0,0,(stat.S_IFREG|0o600)<<16,0)+name
    end=struct.pack('<4s4H2IH',b'PK\x05\x06',0,0,1,1,len(central),len(local),0)
    return local+central+end


def central_offset(data):return struct.unpack_from('<I',data,len(data)-6)[0]


def mutate(data,offset,fmt,value):
    result=bytearray(data);struct.pack_into(fmt,result,offset,value);return bytes(result)
