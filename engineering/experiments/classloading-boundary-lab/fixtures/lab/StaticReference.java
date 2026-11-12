package lab;
public final class StaticReference {
    static { Trace.mark("StaticReference"); }
    public static final String VALUE = client.ClientApi.value();
    public static String value() { return VALUE; }
}
