"""Original restrictive ZIP32 inspection experiment. Never extract or execute.

Only immutable bytes, STORE/DEFLATE and ordinary contiguous records. Unsupported
features are refused, not classified as malicious. Not a production ZIP parser.
"""
from dataclasses import dataclass, asdict
import hashlib
import io
import stat
import struct
import unicodedata
import zipfile
import zlib

END=struct.Struct('<4s4H2IH')
CENTRAL=struct.Struct('<4s6H3I5H2I')
LOCAL=struct.Struct('<4s5H3I2H')


@dataclass(frozen=True)
class Limits:
    archive_bytes:int=1048576
    entries:int=64
    name_bytes:int=512
    depth:int=8
    member_bytes:int=32768
    total_bytes:int=65536
    chunk_bytes:int=4096

    def checked(self):
        for value in asdict(self).values():
            if type(value) is not int or value<=0:raise ValueError('positive integer limits required')
        if self.chunk_bytes>self.member_bytes:raise ValueError('chunk exceeds member budget')
        return self


class Refused(Exception):pass


def need(condition,code):
    if not condition:raise Refused(code)


def portable_key(name,limits):
    need('\x00' not in name and '\\' not in name,'ambiguous_separator_or_nul')
    directory=name.endswith('/');parts=name[:-1].split('/') if directory else name.split('/')
    need(0<len(parts)<=limits.depth,'path_depth')
    need(len(name.encode('utf-8'))<=limits.name_bytes,'name_bytes')
    reserved={'CON','PRN','AUX','NUL','CONIN$','CONOUT$'}|{prefix+d for prefix in ('COM','LPT') for d in '123456789¹²³'}
    for part in parts:
        need(part not in ('','.','..'),'relative_nonempty_components_required')
        need(not part.endswith((' ','.')),'trailing_space_or_period')
        need(not any(c in '<>:"|?*' or unicodedata.category(c).startswith('C') for c in part),'reserved_or_control_character')
        need(part.split('.')[0].rstrip(' .').upper() not in reserved,'reserved_device_name')
    return tuple(unicodedata.normalize('NFC',unicodedata.normalize('NFC',p).casefold()) for p in parts),directory


def inventory(data,limits):
    """Bound raw record traversal before constructing ZipInfo objects."""
    need(len(data)>=END.size,'missing_end_record')
    e=END.unpack_from(data,len(data)-END.size)
    need(e[0]==b'PK\x05\x06' and e[7]==0,'unsupported_end_or_archive_comment')
    need(e[1]==e[2]==0 and e[3]==e[4],'multipart_or_count_disagreement')
    count,size,offset=e[4],e[5],e[6]
    need(count<=limits.entries,'entry_budget')
    need(offset+size==len(data)-END.size,'central_extent')
    cursor=offset;records=[];expected_local=0;seen={};declared=0
    for number in range(count):
        need(cursor+CENTRAL.size<=len(data)-END.size,'truncated_central')
        c=CENTRAL.unpack_from(data,cursor)
        need(c[0]==b'PK\x01\x02','central_signature')
        need(c[11]==c[12]==c[13]==0,'unsupported_extra_comment_or_disk')
        need(0<c[10]<=limits.name_bytes,'name_bytes')
        stop=cursor+CENTRAL.size+c[10]
        need(stop<=len(data)-END.size,'truncated_name')
        rawname=data[cursor+CENTRAL.size:stop]
        need(c[1]>>8 in (0,3) and c[2] in ((10,20) if c[4]==0 else (20,)) and c[3] in (0,0x800) and c[4] in (0,8),'unsupported_zip_feature')
        try:name=rawname.decode('utf-8' if c[3]&0x800 else 'cp437')
        except UnicodeError:raise Refused('invalid_name_encoding') from None
        key,directory=portable_key(name,limits)
        need(not directory or c[2]==20,'unsupported_zip_feature')
        need(key not in seen,'duplicate_or_portable_name_collision')
        need(not any(seen.get(key[:n])=='file' for n in range(1,len(key))),'file_directory_conflict')
        need(directory or not any(old[:len(key)]==key for old in seen),'file_directory_conflict')
        seen[key]='directory' if directory else 'file'
        mode=stat.S_IFMT(c[15]>>16) if c[1]>>8==3 else 0
        need(mode in (0,stat.S_IFDIR if directory else stat.S_IFREG),'unsupported_member_type')
        need(not c[15]&0x08,'unsupported_volume_label')
        need(not c[15]&0x10 or directory,'directory_attribute_conflict')
        need(not directory or c[8]==c[9]==c[7]==0,'directory_payload')
        need(c[9]<=limits.member_bytes,'declared_member_budget')
        declared+=c[9];need(declared<=limits.total_bytes,'declared_total_budget')
        need(c[16]==expected_local and c[16]+LOCAL.size<=offset,'noncontiguous_or_overlapping_local_records')
        l=LOCAL.unpack_from(data,c[16])
        need(l[0]==b'PK\x03\x04','local_signature')
        need(l[10]==0,'unsupported_local_extra')
        need(l[1:9]==c[2:10] and l[9]==c[10],'local_central_disagreement')
        start=c[16]+LOCAL.size+l[9];end=start+c[8]
        need(end<=offset and data[c[16]+LOCAL.size:start]==rawname,'local_name_or_extent_disagreement')
        records.append({'name':name,'kind':'directory' if directory else 'file',
                        'method':c[4],'compressed_bytes':c[8],'declared_bytes':c[9],
                        'crc32':c[7],'start':start,'end':end})
        expected_local=end;cursor=stop
    need(cursor==offset+size and expected_local==offset,'unaccounted_archive_bytes')
    # Reuse the installed library's metadata decoder only after bounded preflight.
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        infos=archive.infolist();need(len(infos)==len(records),'library_inventory_disagreement')
        for info,row in zip(infos,records):
            need((info.filename,info.compress_size,info.file_size,info.CRC)==
                 (row['name'],row['compressed_bytes'],row['declared_bytes'],row['crc32']),
                 'library_inventory_disagreement')
    return records


def inspect(data,limits=Limits(),*,cancel=lambda:False):
    """Return complete/partial/refused evidence, never a filesystem destination.

    A single sentinel byte can establish a crossed output budget. No unbounded
    zlib.flush call or full member materialization is used. CPU/RSS are not capped.
    """
    limits.checked()
    if type(data) is not bytes:raise TypeError('immutable bytes required')
    result={'schema_version':1,'status':'refused','complete':False,'limits':asdict(limits),
            'archive_bytes':len(data),'archive_sha256':None,'entries':[],
            'decoded_bytes_observed':0,'max_output_chunk':0,'error':None}
    if len(data)>limits.archive_bytes:result['error']='archive_byte_budget';return result
    result['archive_sha256']=hashlib.sha256(data).hexdigest()
    try:
        need(not cancel(),'cancelled');records=inventory(data,limits)
    except (Refused,zipfile.BadZipFile) as error:result['error']=str(error);return result
    result['entries']=[dict(row,status='not_attempted',observed_bytes=0,sha256=None) for row in records]
    for row in result['entries']:
        digest=hashlib.sha256();crc=0;row['status']='reading';cursor=row['start'];pending=b''
        inflater=zlib.decompressobj(-15) if row['method']==8 else None
        try:
            while True:
                need(not cancel(),'cancelled')
                member_left=limits.member_bytes-row['observed_bytes']
                total_left=limits.total_bytes-result['decoded_bytes_observed']
                cap=min(limits.chunk_bytes,member_left+1,total_left+1)
                stream_error=None
                if inflater is None:
                    if cursor==row['end']:break
                    chunk=data[cursor:min(row['end'],cursor+cap)];cursor+=len(chunk)
                else:
                    if not pending and cursor<row['end']:
                        end=min(row['end'],cursor+limits.chunk_bytes);pending=data[cursor:end];cursor=end
                    before=len(pending);chunk=inflater.decompress(pending,cap);pending=inflater.unconsumed_tail
                    if inflater.eof:
                        if inflater.unused_data or pending or cursor!=row['end']:stream_error='trailing_compressed_bytes'
                    elif not chunk and not pending and cursor==row['end']:
                        raise Refused('truncated_deflate_stream')
                    elif not chunk and len(pending)==before and pending:
                        raise Refused('no_decompression_progress')
                row['observed_bytes']+=len(chunk);result['decoded_bytes_observed']+=len(chunk)
                result['max_output_chunk']=max(result['max_output_chunk'],len(chunk))
                need(stream_error is None,stream_error)
                need(row['observed_bytes']<=limits.member_bytes,'actual_member_budget')
                need(result['decoded_bytes_observed']<=limits.total_bytes,'actual_total_budget')
                digest.update(chunk);crc=zlib.crc32(chunk,crc)
                if inflater is not None and inflater.eof:break
            need(row['observed_bytes']==row['declared_bytes'],'actual_declared_size_disagreement')
            need(crc==row['crc32'],'crc_mismatch')
            row['sha256']=digest.hexdigest();row['status']='verified'
        except (Refused,zlib.error) as error:
            row['status']='failed';row['error']=str(error);result['status']='partial';result['error']=str(error);return result
    result.update(status='complete',complete=True);return result
