import test from 'node:test';
import assert from 'node:assert/strict';
import {githubRepo, assertGithubRepo, githubReleaseAssets, portableFilename} from './github-release.ts';
const repo = 'Owner/Project';
const digest = 'a'.repeat(64);
const fixture = () => ({id:42,tag_name:'v1.2',draft:false,prerelease:false,published_at:'2026-01-01T00:00:00Z',url:'https://api.github.com/repos/owner/project/releases/42',html_url:'https://github.com/Owner/Project/releases/tag/v1.2',assets:[{id:11,name:'Asset pack.zip',state:'uploaded',size:123,url:'https://api.github.com/repos/owner/project/releases/assets/11',browser_download_url:'https://github.com/owner/project/releases/download/v1.2/Asset%20pack.zip',digest:`sha256:${digest}`} ]});
test('identity and repository response binding',()=>{
  assert.equal(githubRepo('https://github.com/Owner/Project.git/releases/tag/v1.2'),'Owner/Project');
  assert.equal(githubRepo(repo),repo);
  assert.doesNotThrow(()=>assertGithubRepo(repo,{id:1,full_name:'owner/project',html_url:'https://github.com/owner/project'}));
  assert.throws(()=>assertGithubRepo(repo,{id:1,full_name:'owner/other',html_url:'https://github.com/owner/other'}));
  for(const bad of ['https://github.com.evil.test/Owner/Project','https://user@github.com/Owner/Project','https://github.com/topics/mods','https://github.com/Owner/%2Fother','https://github.com/Owner/..','http://github.com/Owner/Project']) assert.throws(()=>githubRepo(bad));
});
test('exact stable release, expected size and digest; absent digest stays absent',()=>{
  const result=githubReleaseAssets(repo,fixture());
  assert.equal(result[0].expectedSha256,digest);assert.equal(result[0].sizeBytes,123);assert.equal(result[0].assetId,11);
  const f=fixture();delete f.assets[0].digest;assert.equal(githubReleaseAssets(repo,f)[0].expectedSha256,undefined);
  f.assets=[];assert.deepEqual(githubReleaseAssets(repo,f),[]);
});
test('reject wrong repository, tag, draft, invalid digest and ambiguous assets',()=>{
  for(const mutate of [f=>f.draft=true,f=>f.prerelease=true,f=>f.published_at='2999-01-01T00:00:00Z',f=>f.url='https://api.github.com/repos/owner/other/releases/42',f=>f.assets[0].browser_download_url='https://github.com/owner/project/releases/download/v1.1/Asset%20pack.zip',f=>f.assets[0].digest='sha256:bad',f=>f.assets.push({...f.assets[0]}),f=>f.assets[0].name='../evil.zip',f=>f.assets[0].state='starter']) {const f=fixture();mutate(f);assert.throws(()=>githubReleaseAssets(repo,f));}
  assert.equal(portableFilename('AUX.zip'),false);assert.equal(portableFilename('a/b.zip'),false);assert.equal(portableFilename('normal-file.zip'),true);
});
