package lab;
public final class Exploding {
    static {
        Trace.mark("Exploding");
        if (Boolean.parseBoolean(System.getProperty("atlas.fixture.fail", "true")))
            throw new IllegalStateException("original synthetic initializer failure");
    }
    public static String ping() { return "ready"; }
}
