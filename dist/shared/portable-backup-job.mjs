// Decode an explicitly selected backup in one job. No persistent workers or storage.
const workerMinimumBytes = 256 * 1024;
export function createPortableBackupReader(kind, parseBackup) {
  let cancelCurrent = null;
  function cancel() { cancelCurrent?.(); }
  function read(file) {
    cancel();
    return new Promise((resolve, reject) => {
      let active = true, localStarted = false, worker;
      function terminate() {
        worker?.terminate();
        worker = undefined;
      }
      function finish(callback, value) {
        if (!active) return;
        active = false;
        if (cancelCurrent === stop) cancelCurrent = null;
        terminate();
        callback(value);
      }
      function stop() { finish(reject, new DOMException('Backup read canceled', 'AbortError')); }
      async function local() {
        if (!active || localStarted) return;
        localStarted = true;
        terminate();
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          if (active) finish(resolve, parseBackup(bytes));
        } catch (error) { finish(reject, error); }
      }
      cancelCurrent = stop;
      try {
        if (typeof Worker !== 'function' || file.size < workerMinimumBytes) return void local();
        worker = new Worker(new URL('./portable-backup-worker.mjs', import.meta.url), {type:'module'});
        worker.onmessage = event => {
          if (!active || localStarted) return;
          const result = event.data;
          if (result?.ok === true) finish(resolve, result.value);
          else finish(reject, Error(result?.error || 'Backup read failed'));
        };
        worker.onerror = event => { event.preventDefault?.(); void local(); };
        worker.onmessageerror = () => { void local(); };
        worker.postMessage({kind, file});
      } catch { void local(); }
    });
  }
  return {read, cancel};
}
