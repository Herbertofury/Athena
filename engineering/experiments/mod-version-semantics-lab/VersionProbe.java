import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import net.fabricmc.loader.api.Version;
import net.fabricmc.loader.api.VersionParsingException;
import net.fabricmc.loader.api.metadata.version.VersionPredicate;
import org.apache.maven.artifact.versioning.ComparableVersion;
import org.apache.maven.artifact.versioning.DefaultArtifactVersion;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;

/** Synthetic API experiment only. Does not load a game, mods, or a mod solver. */
class VersionProbe {
    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("One bounded TSV input required");
        Path input = Path.of(args[0]);
        if (Files.size(input) > 65536) throw new IllegalArgumentException("Input too large");
        List<String> lines = Files.readAllLines(input, StandardCharsets.UTF_8);
        if (lines.size() > 256) throw new IllegalArgumentException("Too many cases");
        for (String line : lines) {
            String[] f = line.split("\t", -1);
            if (f.length != 4 || !f[0].matches("[a-z0-9_-]{1,64}")) {
                throw new IllegalArgumentException("Malformed case");
            }
            String value;
            String detail = "";
            try {
                switch (f[1]) {
                    case "fabric_compare":
                        value = Integer.toString(Integer.signum(Version.parse(f[2]).compareTo(Version.parse(f[3]))));
                        break;
                    case "maven_compare":
                        value = Integer.toString(Integer.signum(new ComparableVersion(f[2]).compareTo(new ComparableVersion(f[3]))));
                        break;
                    case "fabric_match":
                        value = Boolean.toString(VersionPredicate.parse(f[2]).test(Version.parse(f[3])));
                        break;
                    case "maven_match":
                        VersionRange range = VersionRange.createFromVersionSpec(f[2]);
                        value = Boolean.toString(range.containsVersion(new DefaultArtifactVersion(f[3])));
                        detail = "recommended=" + (range.getRecommendedVersion() == null ? "" : range.getRecommendedVersion().toString())
                                + ";restrictions=" + range.getRestrictions().size() + ";hard=" + range.hasRestrictions();
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported operation");
                }
                System.out.println(f[0] + "\tok\t" + value + "\t" + detail);
            } catch (VersionParsingException | InvalidVersionSpecificationException e) {
                System.out.println(f[0] + "\tparse_error\t\t" + e.getClass().getSimpleName());
            }
        }
    }
}
