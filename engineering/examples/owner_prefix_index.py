"""Exact case-sensitive delimited-prefix example, NOT a real mod resolver.

Inputs are validated basenames and ASCII owner identifiers. All matching owners
are returned, including ambiguous prefixes. No filesystem access or guessing.
"""
from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping
import re
OWNER=re.compile(r'^[A-Za-z0-9_-]{1,128}$')

def validate_name(filename):
    if not isinstance(filename,str) or not filename or '/' in filename or '\\' in filename or '\0' in filename:
        raise ValueError('expected a nonempty basename, not a path')

def owners_checked(owners):
    if isinstance(owners,(str,bytes)):raise ValueError('expected an iterable of owner IDs, not a string')
    try:values=tuple(owners)
    except TypeError as e:raise ValueError('expected an iterable of owner IDs') from e
    if not all(isinstance(x,str) and OWNER.fullmatch(x) for x in values):
        raise ValueError('unsupported owner identifier')
    return set(values)

def reference_matches(filename,owners):
    validate_name(filename)
    return sorted(x for x in owners_checked(owners) if filename==x or filename.startswith(x+'.') or filename.startswith(x+'-'))

@dataclass(frozen=True)
class Node:
    children: Mapping[str,'Node']
    owner: str | None

class OwnerPrefixIndex:
    def __init__(self,owners):
        root={'children':{},'owner':None}
        for owner in owners_checked(owners):
            node=root
            for char in owner:node=node['children'].setdefault(char,{'children':{},'owner':None})
            node['owner']=owner
        def freeze(node):return Node(MappingProxyType({k:freeze(v) for k,v in node['children'].items()}),node['owner'])
        self._root=freeze(root)
    def matches(self,filename):
        validate_name(filename);node=self._root;found=[]
        for position,char in enumerate(filename):
            node=node.children.get(char)
            if node is None:break
            if node.owner is not None and (position+1==len(filename) or filename[position+1] in '.-'):
                found.append(node.owner)
        return sorted(found)
