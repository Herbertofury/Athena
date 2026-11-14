package lab;
public final class DescriptorReference {
    static { Trace.mark("DescriptorReference"); }
    public static String ping() { return "common"; }
    public static client.ClientApi passthrough(client.ClientApi value) { return value; }
}
