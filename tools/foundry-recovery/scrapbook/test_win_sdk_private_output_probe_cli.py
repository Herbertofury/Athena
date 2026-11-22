"""Test-only SDK probe. Windows checks run only in a GitHub-hosted temp fixture."""
import json
import os
from pathlib import Path
import platform
import shutil
import stat
import subprocess
import tempfile
import unittest


SOURCE = Path(__file__).with_name('win_sdk_private_output_probe.c')


def limited_run(argv, cwd, *, env=None):
    # Own fixed fixture and trusted built-in / installed compiler executables only.
    result = subprocess.run([str(arg) for arg in argv], cwd=cwd, capture_output=True,
                            env=env, timeout=90, shell=False)
    if result.returncode:
        message = (result.stdout + result.stderr).decode('utf-8', errors='replace')[-4000:]
        # Known fixture-only build diagnostics; no payload or user-provided source.
        raise AssertionError(f'fixture program returned {result.returncode}: {message}')
    return result.stdout


class WindowsSDKProbe(unittest.TestCase):
    @unittest.skipIf(os.name == 'nt', 'Portable Linux leaf-only contract, not a Win32 SDK run')
    def test_compiled_portable_leaf_contract_only(self):
        cc = shutil.which('cc')
        if not cc:
            self.skipTest('Portable C compiler unavailable; no Windows claims')
        with tempfile.TemporaryDirectory(prefix='athena-portable-leaf-') as path:
            temp = Path(path)
            exe = temp/'leaf-contract'
            limited_run([cc, '-std=c11', '-Wall', '-Wextra', '-Werror', SOURCE, '-o', exe], temp)
            self.assertEqual(limited_run([exe], temp), b'')

    @unittest.skipUnless(os.name == 'nt', 'Windows SDK/local NTFS only; not run on Linux')
    def test_actual_windows_sdk_dacl_and_no_replace_local_fixture(self):
        # Do not run against a user's temp directory or a self-hosted runner.
        if (os.environ.get('GITHUB_ACTIONS') != 'true' or
                os.environ.get('RUNNER_ENVIRONMENT') != 'github-hosted'):
            self.skipTest('Owner/self-hosted Windows excluded; explicit GitHub-hosted temp fixture only')
        self.assertEqual(os.environ.get('RUNNER_OS'), 'Windows')
        self.assertIn(platform.machine().lower(), ('amd64', 'x86_64'))
        runner = Path(os.environ['RUNNER_TEMP'])
        system = Path(os.environ['SystemRoot'])
        installer = Path(os.environ['ProgramFiles(x86)'])/'Microsoft Visual Studio'/'Installer'
        root64 = Path(os.environ['ProgramFiles'])/'Microsoft Visual Studio'
        self.assertTrue(runner.is_absolute() and runner.is_dir())
        self.assertTrue(system.is_absolute() and system.is_dir())
        self.assertTrue((installer/'vswhere.exe').is_file())
        cmd = system/'System32/cmd.exe'
        self.assertTrue(cmd.is_file())
        with (tempfile.TemporaryDirectory(prefix='athena-sdk-build-', dir=runner) as build,
              tempfile.TemporaryDirectory(prefix='athena-sdk-fixture-', dir=runner) as fixture):
            out, work = Path(build), Path(fixture)
            installations = limited_run([installer/'vswhere.exe', '-latest', '-products', '*',
                                         '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
                                         '-property', 'installationPath'], out).decode().splitlines()
            self.assertEqual(len(installations), 1, 'Expected one exact installed MSVC SDK binding')
            installed = Path(installations[0])
            self.assertTrue(installed.is_absolute() and installed.is_relative_to(root64))
            dev = installed/'Common7/Tools/VsDevCmd.bat'
            self.assertTrue(dev.is_file())
            shutil.copyfile(SOURCE, out/'probe.c')
            script = out/'build-probe.cmd'
            script.write_text(
                '@echo off\r\n'
                'call "%ATHENA_TEST_VSDEV%" -no_logo -arch=x64 -host_arch=x64\r\n'
                'if errorlevel 1 exit /b %errorlevel%\r\n'
                'cl.exe /nologo /std:c11 /W3 /utf-8 /DUNICODE /D_UNICODE probe.c advapi32.lib /Fe:probe.exe\r\n'
                'exit /b %errorlevel%\r\n',
                encoding='ascii', newline='')
            build_env = {**os.environ, 'ATHENA_TEST_VSDEV': str(dev)}
            limited_run([cmd, '/d', '/c', script.name], out, env=build_env)
            binary = out/'probe.exe'
            self.assertTrue(binary.is_file())
            (work/'reparse-target').mkdir()
            (work/'reparse-target'/'owned-sentinel.txt').write_bytes(b'owned sentinel')
            # Ordinary junction creation in the owned fixture. Failure refuses;
            # never adjusts Developer Mode or an account/privilege to retry it.
            smoke_env = {'SystemRoot': str(system), 'RUNNER_TEMP': str(runner),
                         'ATHENA_SDK_PROBE_FIXTURE': 'owned-runner', 'TEMP': str(work), 'TMP': str(work)}
            limited_run([cmd, '/d', '/c', 'mklink', '/J', 'reparse-owned', 'reparse-target'], work, env=smoke_env)
            link = work/'reparse-owned'
            self.assertTrue(link.lstat().st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)
            record = json.loads(limited_run([binary], work, env=smoke_env))
            self.assertEqual(record, {'privateNoReplaceSdkFixture': True, 'renameInfoNameOffset': 20,
                                      'normalUserDaclAtCreationAndReadback': True, 'noReplaceCases': 2,
                                      'injectedPartialPayloadUnpublished': True, 'ownedJunctionRefused': True})
            self.assertEqual((work/'reparse-target'/'owned-sentinel.txt').read_bytes(), b'owned sentinel')
            print(json.dumps(record, sort_keys=True))


if __name__ == '__main__':
    unittest.main()
