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
pub struct Stats {
    peak_delta: usize,
    held_delta: i128,
    total: usize,
    allocations: usize,
    reallocations: usize,
}
pub fn measure<T>(
    f: impl FnOnce() -> Result<T, Box<dyn std::error::Error>>,
) -> (Result<T, Box<dyn std::error::Error>>, Stats) {
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
pub fn row(s: Stats) -> Value {
    json!({"peak_requested_rust_bytes_above_start":s.peak_delta,"held_requested_rust_bytes_above_start":s.held_delta,"total_successfully_requested_bytes":s.total,"allocation_calls":s.allocations,"reallocation_calls":s.reallocations})
}

pub fn live_requested() -> usize {
    LIVE.load(Relaxed)
}
pub fn accounting_error() -> bool {
    ACCOUNTING_ERROR.load(Relaxed)
}
