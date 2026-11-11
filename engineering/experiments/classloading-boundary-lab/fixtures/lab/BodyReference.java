package lab;
public final class BodyReference {
    static { Trace.mark("BodyReference"); }
    public static String run(boolean useClient) {
        if (useClient) return client.ClientApi.value();
        return "common";
    }
}
