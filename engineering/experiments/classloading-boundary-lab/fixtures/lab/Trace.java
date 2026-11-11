package lab;
public final class Trace {
    public static void mark(String event) {
        String before = System.getProperty("atlas.fixture.events", "");
        System.setProperty("atlas.fixture.events", before.isEmpty() ? event : before + "," + event);
    }
}
