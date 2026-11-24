//! Requested Rust-allocation accounting, not RSS or native allocator peak memory.
//! No timing claims: the instrumentation itself changes execution costs.
use serde_json::{Value, json};
use std::{
    alloc::{GlobalAlloc, Layout, System},
    hint::black_box,
    sync::atomic::{AtomicBool, AtomicUsize, Ordering::Relaxed},
};
struct CountedSystem;
static LIVE: AtomicUsize = AtomicUsize::new(0);
static PEAK: AtomicUsize = AtomicUsize::new(0);
static TOTAL: AtomicUsize = AtomicUsize::new(0);
static ALLOCS: AtomicUsize = AtomicUsize::new(0);
static REALLOCS: AtomicUsize = AtomicUsize::new(0);
static ACCOUNTING_ERROR: AtomicBool = AtomicBool::new(false);
fn add(size: usize) {
    let old = LIVE.fetch_add(size, Relaxed);
    let (now, overflow) = old.overflowing_add(size);
    if overflow {
        ACCOUNTING_ERROR.store(true, Relaxed);
    }
    PEAK.fetch_max(now, Relaxed);
    TOTAL.fetch_add(size, Relaxed);
}
fn sub(size: usize) {
    if LIVE.fetch_sub(size, Relaxed) < size {
        ACCOUNTING_ERROR.store(true, Relaxed);
    }
}
// SAFETY: forward the exact pointer/layout to System, change no allocation data,
// and perform only nonallocating, nonpanicking atomic accounting around it.
unsafe impl GlobalAlloc for CountedSystem {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let p = unsafe { System.alloc(layout) };
        if !p.is_null() {
            add(layout.size());
            ALLOCS.fetch_add(1, Relaxed);
        }
        p
    }
    unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
        let p = unsafe { System.alloc_zeroed(layout) };
        if !p.is_null() {
            add(layout.size());
            ALLOCS.fetch_add(1, Relaxed);
        }
        p
    }
    unsafe fn dealloc(&self, p: *mut u8, layout: Layout) {
        unsafe { System.dealloc(p, layout) };
        sub(layout.size());
    }
    unsafe fn realloc(&self, p: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        let next = unsafe { System.realloc(p, layout, new_size) };
        if !next.is_null() {
            sub(layout.size());
            add(new_size);
            REALLOCS.fetch_add(1, Relaxed);
        }
        next
    }
}
#[global_allocator]
static ALLOCATOR: CountedSystem = CountedSystem;
#[derive(Clone, Copy)]
struct Stats {
    peak_delta: usize,
    held_delta: i128,
    total: usize,
    allocations: usize,
    reallocations: usize,
}
fn measure(f: impl FnOnce() -> Result<Value, String>) -> (Result<Value, String>, Stats) {
    let live = LIVE.load(Relaxed);
    let total = TOTAL.load(Relaxed);
    let allocations = ALLOCS.load(Relaxed);
    let reallocations = REALLOCS.load(Relaxed);
    PEAK.store(live, Relaxed);
    let value = black_box(f());
    let stats = Stats {
        peak_delta: PEAK.load(Relaxed).saturating_sub(live),
        held_delta: LIVE.load(Relaxed) as i128 - live as i128,
        total: TOTAL.load(Relaxed).wrapping_sub(total),
        allocations: ALLOCS.load(Relaxed).wrapping_sub(allocations),
        reallocations: REALLOCS.load(Relaxed).wrapping_sub(reallocations),
    };
    (value, stats)
}
fn row(s: Stats) -> Value {
    json!({"peak_requested_rust_bytes_above_start":s.peak_delta,"held_requested_rust_bytes_above_start":s.held_delta,"total_successfully_requested_bytes":s.total,"allocation_calls":s.allocations,"reallocation_calls":s.reallocations})
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let paths: Vec<_> = std::env::args().skip(1).collect();
    if paths.is_empty() || paths.len() > 8 {
        return Err("Supply 1..8 authorized local fixtures".into());
    }
    let inputs: Vec<_> = paths.iter().map(std::fs::read).collect::<Result<_, _>>()?;
    if inputs.iter().any(|x| x.len() > 2 * 1024 * 1024) {
        return Err("Fixture exceeds 2 MiB".into());
    }
    let mut workloads = Vec::new();
    for (index, bytes) in inputs.iter().enumerate() {
        let mut samples = Vec::new();
        for round in 0..6 {
            let pair_start = LIVE.load(Relaxed);
            let baseline =
                || serde_json::from_slice::<Value>(black_box(bytes)).map_err(|e| e.to_string());
            let candidate = || {
                let mut copy = black_box(bytes).to_vec();
                simd_json::serde::from_slice::<Value>(&mut copy).map_err(|e| e.to_string())
            };
            let ((a, sa), (b, sb)) = if round % 2 == 0 {
                (measure(baseline), measure(candidate))
            } else {
                let c = measure(candidate);
                (measure(baseline), c)
            };
            let equal = matches!((&a,&b),(Ok(a),Ok(b)) if a==b);
            drop(a);
            drop(b);
            let post_drop_delta = LIVE.load(Relaxed) as i128 - pair_start as i128;
            samples.push(json!({"round":round,"order":if round%2==0{"baseline,candidate"}else{"candidate,baseline"},"full_value_equal":equal,"post_drop_requested_live_delta":post_drop_delta,"baseline":row(sa),"candidate_with_copy":row(sb)}));
        }
        workloads.push(json!({"fixture_index":index,"input_bytes":bytes.len(),"samples":samples}));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"scope":"instrumented single-thread Rust allocation requests, not process peak memory","accounting_error":ACCOUNTING_ERROR.load(Relaxed),"workloads":workloads,"limitations":["No timing inference from this instrumented binary","Excludes stack, native allocations, allocator overhead, fragmentation and transient internal realloc copies","Retained input bytes are outside each delta; the candidate input copy is inside","Compiler optimization may remove or combine allocations; counts are observations, not correctness assumptions","Library first-use effects are retained; these are not separate cold-process samples","No application or cross-platform acceptance"]})
        )?
    );
    Ok(())
}
