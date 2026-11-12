package lab;
public final class SafeCommon {
    static { Trace.mark("SafeCommon"); }
    public static String value() { return "common"; }
}
