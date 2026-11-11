"""Fixed synthetic child modes, not an arbitrary-command or plugin interface."""
import os
import signal
import sys
import threading
import time

SUCCESS=b'{"value":"caf\xc3\xa9","complete":true}\n'


def write(fd,data):
    while data:
        count=os.write(fd,data);data=data[count:]


def main(mode):
    if mode=='success':write(1,SUCCESS);write(2,b'fixture diagnostic\n')
    elif mode=='split_utf8':
        for b in SUCCESS:write(1,bytes([b]));time.sleep(0.001)
    elif mode=='dual_pressure':
        # Each pipe exceeds the usual pipe capacity; both must be drained.
        t=threading.Thread(target=write,args=(2,b'E'*262144));t.start()
        write(1,b'O'*262144);t.join()
    elif mode in ('stdout_flood','stderr_flood'):
        write(1 if mode=='stdout_flood' else 2,b'F'*1048576)
    elif mode=='nonzero':write(1,SUCCESS);write(2,b'owned failure\n');return 7
    elif mode=='invalid_utf8':write(1,b'\xff\n')
    elif mode=='duplicate_json':write(1,b'{"value":"first","value":"second","complete":true}\n')
    elif mode=='extra_json':write(1,SUCCESS+SUCCESS)
    elif mode=='incomplete_json':write(1,b'{"value":')
    elif mode=='false_success':write(1,b'{"value":"x","complete":false}\n')
    elif mode=='stdin_eof':write(1,SUCCESS if sys.stdin.buffer.read()==b'' else b'bad stdin')
    elif mode=='clean_env':write(1,SUCCESS if 'ATHENA_LAB_SENTINEL' not in os.environ else b'leaked environment')
    elif mode=='close_stdout':os.close(1);write(2,b'only diagnostic\n')
    elif mode in ('hang','ignore_term','eof_then_hang','success_then_hang'):
        if mode=='ignore_term':signal.signal(signal.SIGTERM,signal.SIG_IGN)
        write(2,b'ready\n')
        if mode=='eof_then_hang':os.close(1);os.close(2)
        if mode=='success_then_hang':write(1,SUCCESS)
        time.sleep(30)  # Fixed finite fixture fallback, not an orphaned daemon.
    elif mode=='signal_exit':os.kill(os.getpid(),signal.SIGTERM)
    else:return 64
    return 0


if __name__=='__main__':raise SystemExit(main(sys.argv[1]) if len(sys.argv)==2 else 64)
