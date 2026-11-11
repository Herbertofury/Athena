import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.tools.ToolProvider;
import org.objectweb.asm.ClassReader;
import org.objectweb.asm.ClassVisitor;
import org.objectweb.asm.Handle;
import org.objectweb.asm.Label;
import org.objectweb.asm.MethodVisitor;
import org.objectweb.asm.Opcodes;

/** Compiles only original fixture source, then reads class bytes without loading them. */
class BytecodeProbe {
    static Map<String, Object> row(Object... fields) {
        Map<String, Object> value = new LinkedHashMap<>();
        for (int i = 0; i < fields.length; i += 2) value.put((String) fields[i], fields[i + 1]);
        return value;
    }
    static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof String text) {
            StringBuilder out = new StringBuilder("\"");
            for (char c : text.toCharArray()) {
                if (c == '"' || c == '\\') out.append('\\').append(c);
                else if (c < 32) out.append(String.format("\\u%04x", (int)c));
                else out.append(c);
            }
            return out.append('"').toString();
        }
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        if (value instanceof List<?> list) return "[" + String.join(",", list.stream().map(BytecodeProbe::json).toList()) + "]";
        if (value instanceof Map<?, ?> map) return "{" + String.join(",", map.entrySet().stream().map(e -> json(e.getKey()) + ":" + json(e.getValue())).toList()) + "}";
        throw new IllegalArgumentException("Unsupported JSON value");
    }
    public static void main(String[] args) throws Exception {
        if (args.length != 3) throw new IllegalArgumentException("Fixture root, bounded ID file and work directory required");
        Path root = Path.of(args[0]).toRealPath();
        Path idsPath = Path.of(args[1]);
        Path work = Path.of(args[2]);
        if (Files.size(idsPath) > 8192) throw new IllegalArgumentException("ID input too large");
        List<String> ids = Files.readAllLines(idsPath, StandardCharsets.UTF_8);
        if (ids.isEmpty() || ids.size() > 32 || ids.stream().distinct().count() != ids.size()) throw new IllegalArgumentException("Invalid fixture count/identity");
        var compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("Compiler-capable JDK required");
        for (String id : ids) {
            if (!id.matches("[a-z][a-z0-9_]{0,63}")) throw new IllegalArgumentException("Unsafe fixture ID");
            Path source = root.resolve("fixtures/" + id + "/Target.java").toRealPath();
            if (!source.startsWith(root) || Files.size(source) > 16384) throw new IllegalArgumentException("Invalid source scope/size");
            for (String debug : List.of("none", "all")) {
                Path out = work.resolve(id + "-" + debug); Files.createDirectories(out);
                var diagnostic = new ByteArrayOutputStream();
                int exit = compiler.run(null, diagnostic, diagnostic, "-source", "21", "-target", "21", "-proc:none", debug.equals("all") ? "-g" : "-g:none",
                        "-encoding", "UTF-8", "-classpath", out.toString(), "-d", out.toString(), source.toString());
                if (exit != 0 || diagnostic.size() != 0) throw new IllegalStateException("Fixture compilation failed or warned: " + id + "/" + debug + " " + diagnostic);
                byte[] bytes = Files.readAllBytes(out.resolve("lab/Target.class"));
                if (bytes.length > 65536) throw new IllegalStateException("Generated class too large");
                var methods = new ArrayList<Object>();
                ClassReader reader = new ClassReader(bytes);
                reader.accept(new ClassVisitor(Opcodes.ASM9) {
                    @Override public MethodVisitor visitMethod(int access, String name, String descriptor, String signature, String[] exceptions) {
                        var instructions = new ArrayList<Object>();
                        methods.add(row("name", name, "descriptor", descriptor, "access", access, "instructions", instructions));
                        return new MethodVisitor(Opcodes.ASM9) {
                            void add(int opcode, Object... fields) {
                                var instruction = row("index", instructions.size(), "opcode", opcode);
                                instruction.putAll(row(fields)); instructions.add(instruction);
                            }
                            @Override public void visitInsn(int opcode) { add(opcode); }
                            @Override public void visitIntInsn(int opcode, int operand) { add(opcode, "operand", operand); }
                            @Override public void visitVarInsn(int opcode, int variable) { add(opcode, "variable", variable); }
                            @Override public void visitTypeInsn(int opcode, String type) { add(opcode, "type", type); }
                            @Override public void visitFieldInsn(int opcode, String owner, String name, String descriptor) { add(opcode, "owner", owner, "name", name, "descriptor", descriptor); }
                            @Override public void visitMethodInsn(int opcode, String owner, String name, String descriptor, boolean isInterface) { add(opcode, "owner", owner, "name", name, "descriptor", descriptor, "interface", isInterface); }
                            @Override public void visitInvokeDynamicInsn(String name, String descriptor, Handle bootstrap, Object... arguments) { add(Opcodes.INVOKEDYNAMIC, "name", name, "descriptor", descriptor, "bootstrap_owner", bootstrap.getOwner()); }
                            @Override public void visitJumpInsn(int opcode, Label label) { add(opcode); }
                            @Override public void visitLdcInsn(Object value) { add(Opcodes.LDC, "constant", value.toString()); }
                            @Override public void visitIincInsn(int variable, int increment) { add(Opcodes.IINC, "variable", variable, "increment", increment); }
                            @Override public void visitTableSwitchInsn(int min, int max, Label target, Label... labels) { add(Opcodes.TABLESWITCH, "min", min, "max", max); }
                            @Override public void visitLookupSwitchInsn(Label target, int[] keys, Label[] labels) { add(Opcodes.LOOKUPSWITCH, "keys", keys.length); }
                            @Override public void visitMultiANewArrayInsn(String descriptor, int dimensions) { add(Opcodes.MULTIANEWARRAY, "descriptor", descriptor, "dimensions", dimensions); }
                        };
                    }
                }, ClassReader.SKIP_DEBUG | ClassReader.SKIP_FRAMES);
                System.out.println(json(row("fixture", id, "debug", debug, "class_name", reader.getClassName(), "class_major", reader.readUnsignedShort(6),
                        "class_bytes", bytes.length, "class_sha256", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)), "methods", methods)));
            }
        }
    }
}
