const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('HTML IDs are unique and critical workflow controls exist',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate HTML id found');
  for(const id of ['topSettingsTitle','topSettingsBackBtn','reviewTransfersBtn','transferReconciliationDialog','investmentHoldingForm','investmentTransactionForm','investmentTxToHolding','investmentTxToUnits','ecasFile','ecasPassword','confirmEcasImport','reportMainView'])assert.ok(ids.includes(id),`missing ${id}`);
});

test('core module loads before app and is cached by the service worker',()=>{
  assert.ok(html.indexOf('finance-core.js')<html.indexOf('app.js'));
  assert.match(sw,/\.\/finance-core\.js/);
});

test('navigation scopes Activity search, Reports filter, Budget action and Settings back affordance',()=>{
  assert.match(app,/topSearchBtn.*hidden=page!=="transactions"/);
  assert.match(app,/topFilterBtn.*hidden=![^;]*page==="transactions"\|\|page==="reports"/);
  assert.match(app,/topSetBudgetBtn.*hidden=page!=="budgets"/);
  assert.match(app,/topSettingsBackBtn.*hidden=page!=="settings"/);
});

test('reconciled historical source entries are excluded from balances and summaries',()=>{
  assert.match(app,/t\.isReminder\|\|t\.isTransferReconciled/);
  assert.match(app,/!t\.isTransferReconciled/);
});
