/* feed-generation-core 0.1.0 — validated website recipes and portable feed output. */
(function(root,factory){
  const common=typeof module==='object'&&module.exports;
  const api=factory(common?require('../feed-core/feed-core.js'):root.FeedCore,common?require('../content-extraction-core/content-extraction-core.js'):root.ContentExtractionCore);
  if(common)module.exports=api;if(root)root.FeedGenerationCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Feed,Extraction){
  'use strict';
  if(!Feed||!Extraction)throw new Error('feed-generation-core requires feed-core and content-extraction-core.');
  const VERSION='0.1.0';
  const normalizeRecipe=Feed.normalizeFeedRecipe;
  function createBaseline(result){
    const items=Array.isArray(result?.items)?result.items:[];
    return {itemCount:items.length,datedCount:items.filter(i=>Feed.validDate(i.publishedAt||i.date)).length,urls:items.map(i=>Feed.canonicalUrl(i.url)).filter(Boolean).slice(0,500)};
  }
  function validateRegression(result,baseline,recipe={}){
    const normalized=normalizeRecipe(recipe),items=Array.isArray(result?.items)?result.items:[],current=createBaseline(result);
    const errors=[],warnings=[];
    for(const diagnostic of result?.diagnostics||[]){if(diagnostic.level==='error')errors.push(diagnostic);else warnings.push(diagnostic);}
    if(items.length<normalized.minimumItems)errors.push({level:'error',code:'minimum-items',message:`Expected at least ${normalized.minimumItems} item(s), found ${items.length}.`});
    if(normalized.requireDates&&current.datedCount<current.itemCount)errors.push({level:'error',code:'required-dates',message:'One or more required publication dates could not be extracted.'});
    const previous=Number.isFinite(baseline?.itemCount)?Math.max(0,baseline.itemCount):0;
    if(previous&&current.itemCount<previous*(1-normalized.maxDropRatio))errors.push({level:'error',code:'extraction-count-drop',message:`Item count dropped from ${previous} to ${current.itemCount}, beyond this recipe’s allowed ${Math.round(normalized.maxDropRatio*100)}% drop.`});
    if(previous&&Number.isFinite(baseline.datedCount)&&current.itemCount&&baseline.datedCount/previous-current.datedCount/current.itemCount>0.5)warnings.push({level:'warning',code:'publication-date-loss',message:'Publication-date coverage dropped by more than half; check the date selector.'});
    return {ok:errors.length===0,errors,warnings,counts:{current:current.itemCount,previous,dated:current.datedCount}};
  }
  function generate(html,recipe={},options={}){
    const normalized=normalizeRecipe({...recipe,baseUrl:options.baseUrl||recipe.baseUrl});
    if(!normalized.baseUrl)throw new Error('A valid HTTP(S) base URL is required.');
    const source={id:normalized.sourceId,name:normalized.sourceName,url:normalized.baseUrl,category:normalized.category,custom:true,defaultEnabled:true,
      description:`Generated from a ${normalized.mode} extraction recipe.`};
    let extracted;
    if(normalized.mode==='article'){
      const article=Extraction.extractArticle(html,{...options,baseUrl:normalized.baseUrl});
      const item=Feed.normalizeItem({...article,sourceId:source.id},source);
      extracted={items:item?[item]:[],diagnostics:article.diagnostics,stats:{matched:item?1:0,extracted:item?1:0,undated:item&&!item.date?1:0}};
    }else extracted=Extraction.extractListing(html,normalized,{...options,baseUrl:normalized.baseUrl});
    const result={schemaVersion:1,source,items:extracted.items,recipe:normalized,diagnostics:extracted.diagnostics,stats:extracted.stats};
    result.validation=validateRegression(result,options.baseline,normalized);
    return result;
  }
  function exportGenerated(result,options={}){
    if(!result||!Array.isArray(result.items))throw new TypeError('Supply a generated feed result.');
    const validation=validateRegression(result,options.baseline,result.recipe);
    if((!validation.ok||result.validation?.ok===false)&&options.allowInvalid!==true)throw new Error('Extraction validation failed; repair the recipe before publishing this feed.');
    return Feed.exportFeed(result.items,{...options,title:options.title||result.source?.name||'Generated feed',url:options.url||result.source?.url});
  }
  function exportRecipe(recipe){return JSON.stringify({format:'feed-extraction-recipe',schemaVersion:1,recipe:normalizeRecipe(recipe)},null,2);}
  function importRecipe(input){
    if(typeof input!=='string'||input.length>65536)throw new Error('Recipe imports must be JSON text under 64 KiB.');
    const value=JSON.parse(input);
    if(value?.format!=='feed-extraction-recipe'||value.schemaVersion!==1||!value.recipe||typeof value.recipe!=='object'||Array.isArray(value.recipe))throw new Error('Unsupported extraction recipe format or version.');
    return normalizeRecipe(value.recipe);
  }
  return Object.freeze({VERSION,normalizeRecipe,generate,createBaseline,validateRegression,exportGenerated,exportRecipe,importRecipe});
});
