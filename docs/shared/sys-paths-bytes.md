# Follow a path to the bytes it names

Learn paths, encodings, metadata and verification through a real disposable file experiment.

## Learning goals

- Distinguish a pathname from a file’s contents and metadata.
- Explain relative paths and explicit text encoding.
- Verify exact bytes without touching personal files.

## Learn

A pathname tells a program where to look. An absolute path begins from a root; a relative path depends on the current working directory or another explicit base. The same relative string can name different files in two processes. When troubleshooting “file not found,” record both the path and the base rather than assuming the file was deleted.

A path is not the file’s content. Names can include spaces and non-ASCII characters, and directory entries can change while a program holds an open file. Symbolic links add another layer of indirection. For this beginner experiment there are no links or shared directories: every file is inside one newly created temporary directory under the program’s control.

Text is encoded into bytes. UTF-8 can use more than one byte for a character. A text length and a stored byte count therefore need not match. Newline conventions can also affect byte comparisons. Use an explicit encoding and preserve the distinction between logical text and exact bytes when a checksum or protocol depends on it.

Metadata such as size, timestamps and permissions describes aspects of a file, but does not prove its business meaning or origin. Two files can have the same size and different bytes. A modification time can be changed or copied. Compare the content required by the task, not just one convenient metadata field.

Permissions also depend on the containing directories, identity and platform. A readable file can still be inaccessible when path traversal is denied. Windows ACLs, POSIX mode bits and mandatory controls are not interchangeable. We make no permission changes here; the safe skill is recognizing which evidence would be needed rather than applying broad permissions as a repair.

The files command writes a short UTF-8 note named work order.txt in a private temporary directory, reads it back and creates a separate copy. It reports characters, bytes, equality and the result of a harmless missing-file lookup. It accepts no user-supplied path and cleans only its own temporary directory. The exact text is invented and contains no real record.

## Worked example

The fixture text is “café
”. In Python it contains five characters, including the newline, and its UTF-8 representation occupies six bytes because é uses two. Copying those bytes gives an equal file even if the filename is different. A same-length altered string would still require a content comparison. The experiment deliberately asks for missing.txt inside its temporary directory and treats the expected absence as an observation, not a reason to change permissions.

## Practice safely

1. Predict the character and byte counts for the supplied note.
2. Run python3 labs/systems-workshop/offline_lab.py files.
3. Compare the read-back text, stored byte size and copied bytes.
4. Explain why a filename containing spaces does not need to be split into several arguments.
5. State how the base directory changes the meaning of a relative path.
6. Record what the exercise did not test: links, ACLs, shared paths and crash recovery.

## Evidence to keep

- Prediction and observed character/byte counts.
- Actual read-back/copy comparison and expected missing-file result.
- An explanation of path/base and metadata limitations.

## Original check 1

Why can five text characters occupy six UTF-8 bytes?

- Every character must use exactly two bytes
- The file is necessarily corrupt
- The filename is included in the content size
- Some characters use more than one encoded byte

<details><summary>Answer and explanation</summary>

Some characters use more than one encoded byte. Character counts and encoded byte counts measure different things.

</details>

## Original check 2

A relative path worked in one terminal and failed in another. What should you compare first?

- The current base/working directory and exact path
- Every disk’s formatting
- The internet connection
- The monitor resolution

<details><summary>Answer and explanation</summary>

The current base/working directory and exact path. Relative paths are interpreted from a base. A different base can explain the observation without data loss.

</details>

## Original check 3

Two files have equal size. What remains unproven?

- That their sizes are equal
- That their content bytes are equal
- That size can be measured
- That files can have names

<details><summary>Answer and explanation</summary>

That their content bytes are equal. Equal lengths do not imply equal content. Compare bytes or a suitable trusted digest when required.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

No ACL, ownership, symlink, privilege or filesystem security change is performed. This is not a permission-enforcement test.

## Official references

- [Python 3.12 pathlib: platform-aware paths](https://docs.python.org/3.12/library/pathlib.html)

- [Linux kernel: pathname lookup](https://docs.kernel.org/filesystems/path-lookup.html)

- [Python 3.12 tempfile: scoped temporary resources](https://docs.python.org/3.12/library/tempfile.html)

