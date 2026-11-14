"""Count-only compatibility assessment. Never transforms or applies source data."""
import collections,json
from capsule import unpack,parse
SCRAP_FIELDS=frozenset('assetId scope gravity gravityAfterPeel x y rotation scaleX scaleY opacity blendMode locked zIndex skewX skewY brightness contrast saturation hue blur visible anchor pinTargetId pinTargetKey pinX pinY'.split())
NEUTRAL={'opacity':1,'blendMode':'normal','skewX':0,'skewY':0,'brightness':1,'contrast':1,'saturation':1,'hue':0,'blur':0,'visible':True,'gravity':False,'gravityAfterPeel':False}
def assess(capsule):
    raw=unpack(capsule);counts=collections.Counter();formats={}
    for key,value in raw.items():
        if key in ('ff-visual-quality','ff.premium-theme.v1'):
            formats[key]='opaque-original-preference';counts['quality_policy_not_mapped']+=1;continue
        try: data=parse(value)
        except (ValueError,TypeError):
            formats[key]='unparseable-retained';counts['malformed_original_json']+=1;continue
        if key!='ff-scrapbook-layout':
            formats[key]='retained-not-converted';counts['original_format_not_mapped']+=1;continue
        formats[key]='scrapbook-structural-assessment'
        if not isinstance(data,list) or len(data)>10000:
            counts['invalid_or_unbounded_scrapbook']+=1;continue
        seen=set()
        for item in data:
            if not isinstance(item,dict):counts['invalid_instance']+=1;continue
            counts['instances']+=1
            asset=item.get('assetId')
            if not isinstance(asset,str) or not asset:counts['invalid_asset_identity']+=1
            elif asset in seen:counts['duplicate_asset_instances']+=1
            else:seen.add(asset)
            counts['unknown_instance_fields']+=len(set(item)-SCRAP_FIELDS)
            # Do not compare against native object names: identical names do not prove asset equivalence.
            counts['asset_equivalence_required']+=1
            scope=item.get('scope')
            if scope=='ui':counts['source_and_target_geometry_required']+=1
            elif scope=='sticker':counts['anchor_identity_and_geometry_required']+=1
            else:counts['unsupported_scrapbook_scope']+=1
            for field,neutral in NEUTRAL.items():
                if field in item and (type(item[field]) is not type(neutral) and not (type(neutral) is int and type(item[field]) in (int,float)) or item[field]!=neutral):
                    counts['nonneutral_'+field]+=1
            if 'zIndex' in item:counts['stacking_order_requires_mapping']+=1
            if 'anchor' in item:counts['transform_origin_requires_mapping']+=1
    return {'native_conversion_ready':False,'automatic_import':False,'original_values_preserved':True,'formats':formats,'findings':dict(sorted(counts.items())), 'limitations':['Counts describe structural incompatibilities, not complete semantic validation.','No user values, asset identifiers, selectors, coordinates or private strings are returned.','Do not delete source storage; conversion requires explicit asset/instance/geometry mapping and validated renderer semantics.']}
