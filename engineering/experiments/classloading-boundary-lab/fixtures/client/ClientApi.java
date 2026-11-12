package client;
public final class ClientApi {
    static { lab.Trace.mark("ClientApi"); }
    public static String value() { return "client"; }
}
