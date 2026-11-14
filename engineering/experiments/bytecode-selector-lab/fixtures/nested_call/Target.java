package lab;

// Original synthetic fixture. Compiled and inspected, never loaded or executed.
class Target {
    static int hook(int x) { return x + 1; }
    static int other(int x) { return x * 2; }
    static int compute(int x) { return hook(hook(x)); }
}
class Alternate { static int hook(int x) { return x - 1; } }
