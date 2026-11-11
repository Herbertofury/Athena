import java.io.ByteArrayOutputStream;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.tools.ToolProvider;

/** Executes only the original fixture classes in isolated URLClassLoaders. */
class ClassloadingProbe {
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
        if (value instanceof List<?> list) return "[" + String.join(",", list.stream().map(ClassloadingProbe::json).toList()) + "]";
        if (value instanceof Map<?, ?> map) return "{" + String.join(",", map.entrySet().stream().map(e -> json(e.getKey()) + ":" + json(e.getValue())).toList()) + "}";
        throw new IllegalArgumentException("Unsupported JSON");
    }
    public static void main(String[] args) throws Exception {
        if (args.length != 4) throw new IllegalArgumentException("Fixture root, source list, case list, work directory required");
        Path root = Path.of(args[0]).toRealPath(); Path work = Path.of(args[3]);
        Path sourcesPath = Path.of(args[1]), casesPath = Path.of(args[2]);
        if (Files.size(sourcesPath) > 8192 || Files.size(casesPath) > 32768) throw new IllegalArgumentException("Oversized driver inputs");
        List<String> sources = Files.readAllLines(sourcesPath, StandardCharsets.UTF_8);
        if (sources.size() != 9 || sources.stream().distinct().count() != sources.size()) throw new IllegalArgumentException("Nine unique sources required");
        Path compiled = work.resolve("complete"); Files.createDirectories(compiled);
        var options = new ArrayList<>(List.of("-source", "21", "-target", "21", "-proc:none", "-g:none", "-encoding", "UTF-8", "-classpath", compiled.toString(), "-d", compiled.toString()));
        for (String name : sources) {
            if (!name.matches("fixtures/(lab|client)/[A-Za-z]+\\.java")) throw new IllegalArgumentException("Unsafe source name");
            Path source = root.resolve(name).toRealPath();
            if (!source.startsWith(root) || Files.size(source) > 16384) throw new IllegalArgumentException("Invalid source scope/size");
            options.add(source.toString());
        }
        var compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("Compiler-capable JDK required");
        var diagnostic = new ByteArrayOutputStream();
        int code = compiler.run(null, diagnostic, diagnostic, options.toArray(String[]::new));
        if (code != 0 || diagnostic.size() != 0) throw new IllegalStateException("Fixture compile failed/warned: " + diagnostic);
        Path reduced = work.resolve("without_client"); Files.createDirectories(reduced);
        List<Path> classes;
        try (var paths = Files.walk(compiled)) { classes = paths.filter(p -> p.toString().endsWith(".class")).sorted().toList(); }
        if (classes.size() != 9) throw new IllegalStateException("Unexpected compiled class count");
        var inventory = new ArrayList<Object>();
        for (Path p : classes) {
            String name = compiled.relativize(p).toString().replace('\\', '/');
            byte[] bytes = Files.readAllBytes(p);
            if (bytes.length > 16384) throw new IllegalStateException("Class too large");
            if (name.startsWith("lab/")) { Path target = reduced.resolve(name); Files.createDirectories(target.getParent()); Files.write(target, bytes); }
            int major = ((bytes[6] & 255) << 8) | (bytes[7] & 255);
            inventory.add(row("path", name, "bytes", bytes.length, "class_major", major, "sha256", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))));
        }
        var profiles = new LinkedHashMap<String,Object>();
        for (String profile : List.of("complete", "without_client")) {
            try (var paths = Files.walk(work.resolve(profile))) {
                profiles.put(profile, paths.filter(p -> p.toString().endsWith(".class")).map(p -> work.resolve(profile).relativize(p).toString().replace('\\', '/')).sorted().toList());
            }
        }
        System.out.println(json(row("kind", "compiled", "java_version", System.getProperty("java.version"), "java_runtime_version", System.getProperty("java.runtime.version"), "java_vendor", System.getProperty("java.vendor"), "compiler", compiler.getClass().getName(), "inventory", inventory, "profiles", profiles)));
        List<String> cases = Files.readAllLines(casesPath, StandardCharsets.UTF_8);
        if (cases.isEmpty() || cases.size() > 64) throw new IllegalArgumentException("Invalid case count");
        URLClassLoader loader = null; String scenario = null, activeProfile = null; int generation = 0;
        try {
            for (String line : cases) {
                String[] c = line.split("\t", -1);
                if (c.length != 5 || !c[0].matches("[a-z_]+:[1-9][0-9]?") || !c[1].matches("[a-z_]+") || !List.of("complete", "without_client").contains(c[2]) || !c[4].matches("(lab|client)\\.[A-Za-z]+")) throw new IllegalArgumentException("Invalid case identity");
                if (!c[1].equals(scenario)) {
                    if (loader != null) loader.close();
                    scenario = c[1]; activeProfile = c[2]; generation = 1;
                    System.clearProperty("atlas.fixture.events"); System.setProperty("atlas.fixture.fail", "true");
                    loader = new URLClassLoader(new java.net.URL[] {work.resolve(c[2]).toUri().toURL()}, ClassLoader.getPlatformClassLoader());
                } else if (!activeProfile.equals(c[2])) throw new IllegalArgumentException("Scenario profile changed");
                String result = null; var errors = new ArrayList<String>();
                try {
                    if (c[3].equals("clear_failure_then_initialize")) System.setProperty("atlas.fixture.fail", "false");
                    if (c[3].equals("fresh_loader_then_initialize")) {
                        loader.close(); generation++;
                        loader = new URLClassLoader(new java.net.URL[] {work.resolve(c[2]).toUri().toURL()}, ClassLoader.getPlatformClassLoader());
                    }
                    switch (c[3]) {
                        case "discover" -> result = "class:" + Class.forName(c[4], false, loader).getName();
                        case "initialize", "clear_failure_then_initialize", "fresh_loader_then_initialize" -> result = "class:" + Class.forName(c[4], true, loader).getName();
                        case "methods" -> result = "methods:" + String.join(",", Arrays.stream(Class.forName(c[4], false, loader).getDeclaredMethods()).map(m -> m.getName()).sorted().toList());
                        case "invoke:value", "invoke:ping", "invoke:literal", "invoke:boxed" -> result = String.valueOf(Class.forName(c[4], false, loader).getMethod(c[3].substring(7)).invoke(null));
                        case "invoke:run:false", "invoke:run:true" -> result = String.valueOf(Class.forName(c[4], false, loader).getMethod("run", boolean.class).invoke(null, c[3].endsWith(":true")));
                        default -> throw new IllegalArgumentException("Unknown operation");
                    }
                } catch (Throwable failure) {
                    // This fixture intentionally observes linkage/initialization Errors as well as Exceptions.
                    var seen = new IdentityHashMap<Throwable,Boolean>();
                    for (Throwable current = failure; current != null; current = current.getCause()) {
                        if (errors.size() == 16 || seen.put(current, true) != null) throw new IllegalStateException("Unexpected exception chain");
                        errors.add(current.getClass().getName());
                    }
                }
                String trace = System.getProperty("atlas.fixture.events", "");
                List<String> events = trace.isEmpty() ? List.of() : List.of(trace.split(","));
                System.out.println(json(row("kind", "observation", "id", c[0], "scenario", c[1], "profile", c[2], "operation", c[3], "class_name", c[4], "loader_generation", generation, "success", errors.isEmpty(), "result", result, "exception_chain", errors, "events", events)));
            }
        } finally {
            if (loader != null) loader.close();
            System.clearProperty("atlas.fixture.events"); System.clearProperty("atlas.fixture.fail");
        }
    }
}
