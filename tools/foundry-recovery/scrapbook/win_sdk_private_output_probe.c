/* Test fixture only: never accepts an input payload or a user destination. */
#include <wchar.h>

static int leaf_ok(const wchar_t *leaf)
{
    return !wcscmp(leaf, L"candidate.json") || !wcscmp(leaf, L"existing.json") ||
           !wcscmp(leaf, L"racing.json") || !wcscmp(leaf, L"partial.json");
}

#ifndef _WIN32
/* The Linux executable exercises only the fixed synthetic-leaf contract. */
int main(void)
{
    return !(leaf_ok(L"candidate.json") && leaf_ok(L"existing.json") &&
             leaf_ok(L"racing.json") && leaf_ok(L"partial.json") &&
             !leaf_ok(L"../candidate.json") && !leaf_ok(L"x\\candidate.json") &&
             !leaf_ok(L"candidate.json:stream") && !leaf_ok(L"CON.json"));
}
#else
#define WIN32_LEAN_AND_MEAN
#define _WIN32_WINNT 0x0A00
#include <windows.h>
#include <aclapi.h>
#include <sddl.h>
#include <strsafe.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHAIN_LIMIT 32
#define PATH_LIMIT 220
static unsigned published;
static PSID owner;
static SECURITY_ATTRIBUTES private_sa;
static const unsigned char payload[] = "synthetic private SDK fixture";
static const unsigned char sentinel[] = "independent competing fixture";

static void demand(int ok, const char *procedure)
{
    if (!ok) {
        fprintf(stderr, "%s; native_error=%lu; successful_renames=%u\n",
                procedure, (unsigned long)GetLastError(), published);
        ExitProcess(1);
    }
}

static int ordinary(HANDLE h, int directory)
{
    FILE_ATTRIBUTE_TAG_INFO attrs;
    return h != INVALID_HANDLE_VALUE &&
           GetFileInformationByHandleEx(h, FileAttributeTagInfo, &attrs, sizeof(attrs)) &&
           !(attrs.FileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) &&
           !!(attrs.FileAttributes & FILE_ATTRIBUTE_DIRECTORY) == directory;
}

static FILE_ID_INFO file_id(HANDLE h)
{
    FILE_ID_INFO id;
    demand(GetFileInformationByHandleEx(h, FileIdInfo, &id, sizeof(id)), "read pinned file ID");
    return id;
}

static int same_id(FILE_ID_INFO a, FILE_ID_INFO b)
{
    return a.VolumeSerialNumber == b.VolumeSerialNumber &&
           !memcmp(&a.FileId, &b.FileId, sizeof(a.FileId));
}

static HANDLE pin_directory(const wchar_t *name, DWORD access)
{
    HANDLE h = CreateFileW(name, access, FILE_SHARE_READ | FILE_SHARE_WRITE, NULL, OPEN_EXISTING,
                           FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT, NULL);
    demand(ordinary(h, 1), "pin normal nonreparse directory");
    return h;
}

static int chain(const wchar_t *path, HANDLE hold[CHAIN_LIMIT])
{
    wchar_t prefix[MAX_PATH] = {0};
    size_t i, n = wcslen(path);
    int k = 0;
    demand(n >= 4 && n <= PATH_LIMIT && ((path[0] >= L'A' && path[0] <= L'Z') ||
           (path[0] >= L'a' && path[0] <= L'z')) && path[1] == L':' && path[2] == L'\\' &&
           !wcspbrk(path + 2, L"/:"), "strict local DOS drive path");
    wmemcpy(prefix, path, 3);
    demand(GetDriveTypeW(prefix) == DRIVE_FIXED, "reject nonlocal/nonfixed volume");
    hold[k++] = pin_directory(prefix, FILE_READ_ATTRIBUTES);
    for (i = 3; i <= n; ++i) {
        if (path[i] == L'\\' || i == n) {
            const wchar_t *component = path + i;
            while (component > path + 3 && component[-1] != L'\\') --component;
            demand(k < CHAIN_LIMIT && component < path + i &&
                   !(path + i - component == 1 && component[0] == L'.') &&
                   !(path + i - component == 2 && component[0] == L'.' && component[1] == L'.'),
                   "bounded nontraversing local directory chain");
            wmemcpy(prefix, path, i);
            prefix[i] = L'\0';
            hold[k++] = pin_directory(prefix, FILE_READ_ATTRIBUTES);
        }
    }
    return k;
}

static void ensure_acl(HANDLE h)
{
    PSID file_owner = NULL;
    PACL acl = NULL;
    PSECURITY_DESCRIPTOR descriptor = NULL;
    SECURITY_DESCRIPTOR_CONTROL control = 0;
    DWORD revision;
    ACL_SIZE_INFORMATION summary;
    ACCESS_ALLOWED_ACE *entry = NULL;
    PVOID ace_ptr = NULL;
    DWORD error = GetSecurityInfo(h, SE_FILE_OBJECT, OWNER_SECURITY_INFORMATION |
                                 DACL_SECURITY_INFORMATION, &file_owner, NULL, &acl,
                                 NULL, &descriptor);
    if (error != ERROR_SUCCESS) SetLastError(error);
    demand(error == ERROR_SUCCESS, "read ACL by object handle");
    demand(file_owner != NULL && EqualSid(file_owner, owner) && acl != NULL &&
           GetSecurityDescriptorControl(descriptor, &control, &revision) &&
           (control & (SE_DACL_PRESENT | SE_DACL_PROTECTED)) ==
           (SE_DACL_PRESENT | SE_DACL_PROTECTED), "exact creation owner and protected explicit DACL");
    demand(GetAclInformation(acl, &summary, sizeof(summary), AclSizeInformation) &&
           summary.AceCount == 1 && GetAce(acl, 0, &ace_ptr), "one explicit ACL entry");
    entry = (ACCESS_ALLOWED_ACE *)ace_ptr;
    demand(entry != NULL && entry->Header.AceType == ACCESS_ALLOWED_ACE_TYPE &&
           entry->Header.AceFlags == 0 && entry->Mask == FILE_ALL_ACCESS &&
           IsValidSid((PSID)&entry->SidStart) && EqualSid((PSID)&entry->SidStart, owner),
           "DACL grants only exact normal fixture SID");
    LocalFree(descriptor);
}

static void joined(wchar_t result[MAX_PATH], const wchar_t *parent, const wchar_t *leaf)
{
    demand(SUCCEEDED(StringCchPrintfW(result, MAX_PATH, L"%ls\\%ls", parent, leaf)),
           "bounded fixture names");
}

static HANDLE stage_file(const wchar_t *full)
{
    HANDLE h = CreateFileW(full, GENERIC_READ | GENERIC_WRITE | DELETE | READ_CONTROL,
                           FILE_SHARE_READ, &private_sa, CREATE_NEW,
                           FILE_ATTRIBUTE_NORMAL | FILE_FLAG_OPEN_REPARSE_POINT, NULL);
    demand(ordinary(h, 0), "exclusively create ordinary stage with protected ACL");
    ensure_acl(h); /* Before the first payload byte. */
    return h;
}

static void write_all(HANDLE h, const unsigned char *bytes, DWORD count)
{
    DWORD total = 0;
    while (total < count) {
        DWORD written = 0;
        demand(WriteFile(h, bytes + total, count - total, &written, NULL) &&
               written > 0 && written <= count - total, "write bounded staged fixture bytes");
        total += written;
    }
}

static void check_bytes(HANDLE h, const unsigned char *bytes, DWORD count)
{
    unsigned char observed[256];
    LARGE_INTEGER size, zero;
    DWORD read = 0;
    zero.QuadPart = 0;
    demand(count <= sizeof(observed) && GetFileSizeEx(h, &size) && size.QuadPart == (LONGLONG)count &&
           SetFilePointerEx(h, zero, NULL, FILE_BEGIN) &&
           ReadFile(h, observed, count, &read, NULL) && read == count &&
           !memcmp(bytes, observed, count), "exact independent bounded fixture readback");
}

static void absent(const wchar_t *name)
{
    DWORD attrs = GetFileAttributesW(name);
    DWORD e = GetLastError();
    demand(attrs == INVALID_FILE_ATTRIBUTES && (e == ERROR_FILE_NOT_FOUND || e == ERROR_PATH_NOT_FOUND),
           "fixture path must be absent");
}

static void dispose_stage(HANDLE h)
{
    FILE_DISPOSITION_INFO removal;
    removal.DeleteFile = TRUE;
    demand(SetFileInformationByHandle(h, FileDispositionInfo, &removal, sizeof(removal)),
           "dispose only owned unpublished handle");
    demand(CloseHandle(h), "close unpublished stage");
}

static void reject_reparse_fixture(const wchar_t *cwd)
{
    wchar_t name[MAX_PATH];
    FILE_ATTRIBUTE_TAG_INFO attrs;
    HANDLE h;
    joined(name, cwd, L"reparse-owned");
    h = CreateFileW(name, FILE_READ_ATTRIBUTES, FILE_SHARE_READ | FILE_SHARE_WRITE,
                    NULL, OPEN_EXISTING, FILE_FLAG_OPEN_REPARSE_POINT | FILE_FLAG_BACKUP_SEMANTICS, NULL);
    demand(h != INVALID_HANDLE_VALUE &&
           GetFileInformationByHandleEx(h, FileAttributeTagInfo, &attrs, sizeof(attrs)) &&
           (attrs.FileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) &&
           attrs.ReparseTag == IO_REPARSE_TAG_MOUNT_POINT && !ordinary(h, 1),
           "require actual synthetic junction to be refused without following");
    demand(CloseHandle(h), "close independent reparse validation handle");
}

static DWORD rename_leaf(HANDLE stage, HANDLE dir, const wchar_t *leaf)
{
    size_t chars = wcslen(leaf);
    size_t allocated = offsetof(FILE_RENAME_INFO, FileName) + (chars + 1) * sizeof(WCHAR);
    DWORD error = ERROR_SUCCESS;
    FILE_RENAME_INFO *info;
    demand(leaf_ok(leaf) && chars <= 64 && allocated <= 512, "strict relative synthetic output leaf");
    if (allocated < sizeof(FILE_RENAME_INFO)) allocated = sizeof(FILE_RENAME_INFO);
    info = (FILE_RENAME_INFO *)calloc(1, allocated);
    demand(info != NULL, "allocate native Windows SDK rename shape");
    info->ReplaceIfExists = FALSE;
    info->RootDirectory = dir;
    info->FileNameLength = (DWORD)(chars * sizeof(WCHAR)); /* Not counting trailing NUL. */
    memcpy(info->FileName, leaf, info->FileNameLength);
    if (!SetFileInformationByHandle(stage, FileRenameInfo, info, (DWORD)allocated))
        error = GetLastError();
    free(info);
    return error;
}

static void verify_named(const wchar_t *name, const unsigned char *bytes, DWORD count, FILE_ID_INFO id)
{
    HANDLE h = CreateFileW(name, GENERIC_READ | READ_CONTROL,
                           FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, NULL, OPEN_EXISTING,
                           FILE_FLAG_OPEN_REPARSE_POINT, NULL);
    demand(ordinary(h, 0) && same_id(file_id(h), id), "reopen independent exact target handle");
    ensure_acl(h);
    check_bytes(h, bytes, count);
    demand(CloseHandle(h), "close independent target handle");
}

static void relative_case(const wchar_t *path, HANDLE ph, const wchar_t *target, int competitor_when)
{
    wchar_t scratch[MAX_PATH], output[MAX_PATH];
    HANDLE stage, peer, reopened_parent;
    FILE_ID_INFO id, peer_id = {0}, dir_id = file_id(ph);
    DWORD error;
    joined(scratch, path, L"unpublished.tmp");
    joined(output, path, target);
    absent(scratch);
    absent(output);
    if (competitor_when == 1) {
        peer = stage_file(output);
        peer_id = file_id(peer);
        write_all(peer, sentinel, (DWORD)(sizeof(sentinel)-1));
        demand(FlushFileBuffers(peer) && CloseHandle(peer), "flush and close preexisting competitor");
    }
    stage = stage_file(scratch);
    id = file_id(stage);
    demand(id.VolumeSerialNumber == dir_id.VolumeSerialNumber, "same stage and destination volume");
    write_all(stage, payload, (DWORD)(sizeof(payload)-1));
    demand(FlushFileBuffers(stage), "sync complete private stage");
    check_bytes(stage, payload, (DWORD)(sizeof(payload)-1));
    if (competitor_when == 2) {
        peer = stage_file(output);
        peer_id = file_id(peer);
        write_all(peer, sentinel, (DWORD)(sizeof(sentinel)-1));
        demand(FlushFileBuffers(peer) && CloseHandle(peer), "flush and close late competitor");
    }
    reopened_parent = pin_directory(path, FILE_READ_ATTRIBUTES);
    demand(same_id(file_id(reopened_parent), dir_id) && same_id(file_id(stage), id),
           "recheck exact pinned stage and parent before rename");
    demand(CloseHandle(reopened_parent), "close rechecked parent handle");
    error = rename_leaf(stage, ph, target);
    SetLastError(error);
    if (error == ERROR_SUCCESS) ++published;
    if (competitor_when) {
        demand(error == ERROR_ALREADY_EXISTS || error == ERROR_FILE_EXISTS,
               "handle-relative rename must refuse existing target (no fallback)");
        verify_named(output, sentinel, (DWORD)(sizeof(sentinel)-1), peer_id);
        check_bytes(stage, payload, (DWORD)(sizeof(payload)-1));
        dispose_stage(stage);
    } else {
        demand(error == ERROR_SUCCESS, "SDK handle-relative rename failed (no fallback)");
        ensure_acl(stage);
        verify_named(output, payload, (DWORD)(sizeof(payload)-1), id);
        demand(CloseHandle(stage), "close published probe handle");
    }
    absent(scratch);
}

int main(void)
{
    wchar_t cwd[MAX_PATH], runner[MAX_PATH], private_dir[MAX_PATH], stage_name[MAX_PATH], p_name[MAX_PATH];
    wchar_t fs_name[32], sddl[256], gate[32];
    LPWSTR sid_text = NULL;
    HANDLE token, holding[CHAIN_LIMIT], parent, partial;
    DWORD size = 0, features = 0, m, n;
    TOKEN_USER *token_info;
    size_t prefix;
    int count;

    m = GetEnvironmentVariableW(L"ATHENA_SDK_PROBE_FIXTURE", gate, 32);
    demand(m == 12 && !wcscmp(gate, L"owned-runner"), "only launcher-controlled owned runner fixture");
    n = GetCurrentDirectoryW(MAX_PATH, cwd);
    m = GetEnvironmentVariableW(L"RUNNER_TEMP", runner, MAX_PATH);
    demand(n > 0 && n <= PATH_LIMIT - 20 && m > 3 && m < MAX_PATH, "known bounded runner fixture path");
    while (m > 3 && runner[m-1] == L'\\') runner[--m] = L'\0';
    prefix = wcslen(runner);
    demand(n > prefix && !_wcsnicmp(cwd, runner, prefix) && cwd[prefix] == L'\\' &&
           !wcsncmp(cwd + prefix + 1, L"athena-sdk-fixture-", 19) &&
           !wcschr(cwd + prefix + 1, L'\\'), "fixture must be direct child of runner temp");
    count = chain(cwd, holding);
    demand(GetVolumeInformationByHandleW(holding[count-1], NULL, 0, NULL, NULL, &features, fs_name, 32) &&
           !_wcsicmp(fs_name, L"NTFS") && (features & FILE_PERSISTENT_ACLS),
           "local NTFS with persistent ACLs only");
    reject_reparse_fixture(cwd);
    demand(OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token), "read current fixture SID only");
    GetTokenInformation(token, TokenUser, NULL, 0, &size);
    demand(size > 0 && size <= 16384, "bound token user metadata");
    token_info = (TOKEN_USER *)calloc(1, size);
    demand(token_info != NULL && GetTokenInformation(token, TokenUser, token_info, size, &size) &&
           CloseHandle(token), "read normal fixture token user");
    owner = token_info->User.Sid;
    demand(IsValidSid(owner) && ConvertSidToStringSidW(owner, &sid_text) &&
           !wcsncmp(sid_text, L"S-1-5-21-", 9), "normal user SID, not service identity");
    demand(SUCCEEDED(StringCchPrintfW(sddl, 256, L"O:%lsD:P(A;;FA;;;%ls)", sid_text, sid_text)),
           "construct explicit owner-only protected DACL");
    LocalFree(sid_text);
    private_sa.nLength = sizeof(private_sa);
    private_sa.bInheritHandle = FALSE;
    demand(ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl, SDDL_REVISION_1,
           &private_sa.lpSecurityDescriptor, NULL), "materialize creation-time descriptor");

    joined(private_dir, cwd, L"protected-output");
    demand(CreateDirectoryW(private_dir, &private_sa), "exclusive protected fixture directory");
    parent = pin_directory(private_dir, FILE_READ_ATTRIBUTES | FILE_ADD_FILE | FILE_TRAVERSE |
                           READ_CONTROL | SYNCHRONIZE);
    ensure_acl(parent);
    demand(file_id(parent).VolumeSerialNumber == file_id(holding[count-1]).VolumeSerialNumber,
           "protected fixture remains on pinned local volume");
    relative_case(private_dir, parent, L"candidate.json", 0);
    relative_case(private_dir, parent, L"existing.json", 1);
    relative_case(private_dir, parent, L"racing.json", 2);
    joined(stage_name, private_dir, L"partial-stage.tmp");
    joined(p_name, private_dir, L"partial.json");
    partial = stage_file(stage_name);
    write_all(partial, payload, 3); /* Inject abort after a real partial payload. */
    dispose_stage(partial);
    absent(stage_name);
    absent(p_name);
    demand(CloseHandle(parent), "release protected directory handle");
    while (count) demand(CloseHandle(holding[--count]), "release pinned directory");
    LocalFree(private_sa.lpSecurityDescriptor);
    free(token_info);
    printf("{\"privateNoReplaceSdkFixture\":true,\"renameInfoNameOffset\":%u,"
           "\"normalUserDaclAtCreationAndReadback\":true,\"noReplaceCases\":2,"
           "\"injectedPartialPayloadUnpublished\":true,\"ownedJunctionRefused\":true}\n", (unsigned)offsetof(FILE_RENAME_INFO, FileName));
    return 0;
}
#endif
