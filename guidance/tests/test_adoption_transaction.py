import sys
import unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import adoption_transaction as transaction
import repository_governance as governance
from test_repository_governance import GovernanceCases, files

class TransactionTests(unittest.TestCase):
    setUp=GovernanceCases.setUp
    manifest=GovernanceCases.manifest
    adopted=GovernanceCases.adopted
    def fail_replace(self, at, error=OSError('injected I/O failure')):
        original=transaction.os.replace; count=0
        def replace(a,b):
            nonlocal count
            count+=1
            if count==at: raise error
            return original(a,b)
        return replace
    def test_new_adoption_failure_restores_exact_files(self):
        (self.target/'AGENTS.md').write_text('local rules')
        before=files(self.target)
        with patch.object(transaction.os,'replace',side_effect=self.fail_replace(4)):
            with self.assertRaises(OSError): governance.apply(self.source,self.target)
        self.assertEqual(files(self.target),before)
        self.assertFalse(list(self.target.glob('.athena-adoption-*')))
    def test_upgrade_failure_restores_existing_snapshots_and_lock(self):
        self.adopted();before=files(self.target)
        for name in governance.POLICY_FILES[:3]:
            p=self.source/name;p.write_text(p.read_text()+'\nUpdated guidance.\n')
        self.manifest('1.0.1')
        with patch.object(transaction.os,'replace',side_effect=self.fail_replace(3)):
            with self.assertRaises(OSError):governance.apply(self.source,self.target)
        self.assertEqual(files(self.target),before)
    def test_keyboard_interrupt_rolls_back(self):
        before=files(self.target)
        with patch.object(transaction.os,'replace',side_effect=self.fail_replace(2,KeyboardInterrupt())):
            with self.assertRaises(KeyboardInterrupt):governance.apply(self.source,self.target)
        self.assertEqual(files(self.target),before)
    def test_rollback_failure_retains_recovery_not_success(self):
        self.adopted()
        for name in governance.POLICY_FILES[:3]:
            p=self.source/name;p.write_text(p.read_text()+'\nChanged.\n')
        self.manifest('1.0.1'); original=transaction.os.replace; count=0
        def broken(a,b):
            nonlocal count
            count+=1
            if count>=2:raise OSError('storage unavailable')
            return original(a,b)
        with patch.object(transaction.os,'replace',side_effect=broken):
            with self.assertRaisesRegex(OSError,'Rollback incomplete'):governance.apply(self.source,self.target)
        recovery=list(self.target.glob('.athena-adoption-*'))
        self.assertEqual(len(recovery),1);self.assertTrue(list(recovery[0].glob('old-*')))
        with self.assertRaisesRegex(ValueError,'Unresolved adoption'):
            transaction.write_set(self.target,{'new.md':b'test'},governance.safe_path)
if __name__=='__main__':unittest.main()
