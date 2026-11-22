"""Test-only helper: bounded duplex pipes for a trusted, descendant-free direct child."""
import math
import queue
import subprocess
import threading
import time


MAX_BYTES = 4_000_000
CHUNK = 64 * 1024
CLEANUP_SECONDS = 2.0


class Refused(RuntimeError):
    pass


def collect(argv, *, cwd, env, payload=b'', stdout_limit=1_000_000, seconds=20):
    # Environment and absolute trusted argv are supplied by a separate launch policy.
    if (type(payload) is not bytes or len(payload) > MAX_BYTES or type(stdout_limit) is not int
            or not 0 <= stdout_limit <= MAX_BYTES or type(seconds) not in (int, float)
            or not math.isfinite(seconds) or not 0 < seconds <= 60):
        raise Refused('invalid-limit-or-payload')
    deadline = time.monotonic() + seconds
    result_queue = queue.Queue(maxsize=2)
    output = bytearray()

    def reader(stream):
        while True:
            fragment = stream.read(min(CHUNK, stdout_limit + 1 - len(output)))
            if not fragment:
                return
            if len(output) + len(fragment) > stdout_limit:
                raise Refused('stdout-limit')
            output.extend(fragment)

    def writer(stream):
        view = memoryview(payload)
        while view:
            written = stream.write(view[:CHUNK])
            if not isinstance(written, int) or not 0 < written <= min(len(view), CHUNK):
                raise Refused('stdin-short-write')
            view = view[written:]

    def worker(key, operation, stream):
        problem = None
        try:
            with stream:
                operation(stream)
        except Refused as exc:
            problem = str(exc)
        except (OSError, ValueError):
            problem = key + '-io'
        except Exception:
            problem = key + '-worker'
        result_queue.put_nowait((key, problem))

    def left(until):
        return max(0.0, until - time.monotonic())

    try:
        child = subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                 stderr=subprocess.DEVNULL, bufsize=0, shell=False, close_fds=True)
    except (OSError, ValueError):
        raise Refused('launch') from None
    participants = ((child.stdout, 'stdout', reader), (child.stdin, 'stdin', writer))
    active = []
    try:
        for stream, key, operation in participants:
            if left(deadline) == 0:
                raise Refused('deadline')
            t = threading.Thread(target=worker, args=(key, operation, stream),
                                 name='athena-prototype-'+key, daemon=True)
            try:
                t.start()
            except RuntimeError:
                raise Refused('worker-start') from None
            active.append((t, stream))
        for _ in participants:
            if left(deadline) == 0:
                raise Refused('deadline')
            try:
                _, problem = result_queue.get(timeout=left(deadline))
            except queue.Empty:
                raise Refused('deadline') from None
            if problem:
                raise Refused(problem)
        try:
            code = child.wait(timeout=left(deadline))
        except subprocess.TimeoutExpired:
            raise Refused('deadline') from None
        for thread, _ in active:
            thread.join(timeout=left(deadline))
        if left(deadline) == 0 or any(thread.is_alive() for thread, _ in active):
            raise Refused('deadline')
        if code:
            raise Refused('nonzero-exit')
        return bytes(output)
    except BaseException:
        cleanup_end = time.monotonic() + CLEANUP_SECONDS
        unreaped = False
        if child.poll() is None:
            try:
                child.kill()
            except OSError:
                pass
        try:
            child.wait(timeout=left(cleanup_end))
        except (OSError, subprocess.TimeoutExpired):
            unreaped = True
        started = {stream for _, stream in active}
        for stream, _, _ in participants:
            if stream not in started:
                try:
                    stream.close()
                except OSError:
                    unreaped = True
        for thread, _ in active:
            thread.join(timeout=left(cleanup_end))
        if unreaped or any(thread.is_alive() for thread, _ in active):
            raise Refused('cleanup-incomplete') from None
        raise
