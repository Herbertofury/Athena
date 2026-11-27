#!/usr/bin/env python3
"""Build the local, single-file Outpost playtest from the native browser host."""
from argparse import ArgumentParser
from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
WASM = ROOT / "target/wasm32-unknown-unknown/release/outpost_browser.wasm"
NET = """  const response = await fetch('./outpost.wasm');
  if (!response.ok) throw new Error('simulation missing');
  const {instance} = await WebAssembly.instantiate(await response.arrayBuffer());"""
SOURCE_TAGS = '<link rel="stylesheet" href="outpost.css"><script type="module" src="outpost.mjs"></script>'


def one(text, old, new):
    if text.count(old) != 1:
        raise ValueError("Source structure changed; update the bundler rather than guessing")
    return text.replace(old, new, 1)


def digest(text):
    return b64encode(sha256(text.encode("utf-8")).digest()).decode("ascii")


def assemble(wasm):
    if not wasm.startswith(b"\0asm\x01\0\0\0") or len(wasm) > 4 * 1024 * 1024:
        raise ValueError("Expected a bounded WebAssembly v1 module")
    markup = (ROOT / "web/index.html").read_text(encoding="utf-8")
    css = (ROOT / "web/outpost.css").read_text(encoding="utf-8")
    js = (ROOT / "web/outpost.mjs").read_text(encoding="utf-8")
    js = one(js, NET, (
        '  const bytes = Uint8Array.from(atob("' + b64encode(wasm).decode("ascii")
        + '"), c => c.charCodeAt(0));\n  const {instance} = await WebAssembly.instantiate(bytes);'
    ))
    js = one(js, "Could not load the Rust simulation. Serve this folder over HTTP and try again.",
             "Could not start the embedded Rust simulation. Open in a browser that supports WebAssembly.")
    if "</script" in js.lower() or "</style" in css.lower():
        raise ValueError("Refused markup delimiters in an inline asset")
    csp = ("default-src 'none'; script-src 'sha256-" + digest(js)
           + "' 'wasm-unsafe-eval'; style-src 'sha256-" + digest(css)
           + "'; connect-src 'none'; base-uri 'none'; form-action 'none'")
    choices = re.findall(r'<meta http-equiv="Content-Security-Policy" content="[^"]+">', markup)
    if len(choices) != 1:
        raise ValueError("Expected an explicit base Content Security Policy")
    markup = one(markup, choices[0], '<meta http-equiv="Content-Security-Policy" content="' + csp + '">')
    return one(markup, SOURCE_TAGS, f'<style>{css}</style><script type="module">{js}</script>')


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--wasm", type=Path, default=WASM)
    args = parser.parse_args()
    content = assemble(args.wasm.read_bytes())
    args.output.write_bytes(content.encode("utf-8"))


if __name__ == "__main__":
    main()
