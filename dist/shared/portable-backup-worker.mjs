// Every worker handles only one opt-in, local file selection.
self.onmessage = async ({data}) => {
  self.onmessage = null;
  try {
    const handlers = {
      projects: () => import('../workspaces/projects/import.mjs'),
      continuity: () => import('../workspaces/continuity/import.mjs'),
    };
    if (!Object.hasOwn(handlers, data?.kind)) throw Error('Unrecognized backup workspace');
    const {parseBackup, MAX_IMPORT_BYTES} = await handlers[data.kind]();
    if (!(data.file instanceof Blob) || data.file.size > MAX_IMPORT_BYTES) {
      throw Error('Backup exceeds the local import budget or is not a file');
    }
    const value = parseBackup(new Uint8Array(await data.file.arrayBuffer()));
    self.postMessage({ok:true,value});
  } catch (error) {
    self.postMessage({ok:false,error:error?.message || 'Backup read failed'});
  }
};
