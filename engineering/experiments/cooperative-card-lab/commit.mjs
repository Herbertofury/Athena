// Isolated unmanaged #cards host only: cloning does not preserve arbitrary
// event listeners, object references or application-owned state on a container.
export function commitCardFragment(container,fragment,mode='children'){
 if(!['children','container'].includes(mode))throw TypeError('Unknown card commit mode');
 if(mode==='children'){
  container.className='metadata-contained';container.replaceChildren(fragment);return container;
 }
 const replacement=container.cloneNode(false);
 replacement.className='metadata-contained';replacement.append(fragment);
 container.replaceWith(replacement);
 return replacement;
}
