package lab;
public final class ConstantConsumer {
    public static int literal() { return Constants.INLINED; }
    public static int boxed() { return Constants.BOXED; }
}
