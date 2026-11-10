const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('HTML IDs are unique and critical workflow controls exist',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate HTML id found');
  for(const id of ['topSettingsTitle','topSettingsBackBtn','topSetBudgetTitle','topSetBudgetBackBtn','setBudget','budgetEditList','saveAllBudgetsBtn','reportFilterDialog','reportFilterForm','reviewTransfersBtn','transferReconciliationDialog','investmentHoldingForm','investmentTransactionForm','investmentTxToHolding','investmentTxToUnits','ecasFile','ecasPassword','confirmEcasImport','reportMainView','cloudSettingsPage','importSettingsPage','exportSettingsPage'])assert.ok(ids.includes(id),`missing ${id}`);
});

test('core module loads before app and is cached by the service worker',()=>{
  assert.ok(html.indexOf('finance-core.js')<html.indexOf('app.js'));
  assert.match(sw,/\.\/finance-core\.js/);
});

test('navigation scopes Activity, Reports, Budget editor and Settings correctly',()=>{
  assert.match(app,/isActivity=page==="transactions"/);
  assert.match(app,/hidden=!isActivity/);
  assert.match(app,/hidden=\!\(isActivity\|\|isReports\)/);
  assert.match(app,/hidden=!isBudget/);
  assert.match(app,/hidden=!isSetBudget/);
  assert.match(app,/hidden=!isSettings/);
  assert.match(app,/showDialog\("reportFilterDialog"\)/);
});

test('Home no longer renders the four separate asset summary blocks',()=>{
  const home=html.slice(html.indexOf('<section id="dashboard"'),html.indexOf('<section id="transactions"'));
  assert.doesNotMatch(home,/home-summary-grid|homeAssets|homeLiabilities|homeInvestments|homeCashBank/);
});

test('Set Budget is a dedicated page with a back route and bulk category editor',()=>{
  assert.match(html,/<section id="setBudget" class="page">/);
  assert.match(html,/id="topSetBudgetBackBtn"/);
  assert.match(app,/addEventListener\("click",\(\)=>nav\("budgets"\)\)/);
  assert.match(app,/function renderBudgetEditor\(\)/);
  assert.match(app,/saveAllBudgetsBtn/);
});

test('Settings separates cloud, import and export into dedicated subpages',()=>{
  for(const id of ['cloudSettingsPage','importSettingsPage','exportSettingsPage'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/showSettingsSubpage\("cloudSettingsPage","Cloud backup & restore"\)/);
  assert.match(app,/showSettingsSubpage\("importSettingsPage","Import data"\)/);
  assert.match(app,/showSettingsSubpage\("exportSettingsPage","Export data"\)/);
  assert.doesNotMatch(html,/settings-hidden-tools/);
});

test('Date filter fields have a shared compact sizing rule',()=>{
  assert.match(css,/#reportFilterDialog[\s\S]*#filterDialog[\s\S]*height:42px/);
});

test('Reconciled historical source entries are excluded from balances and summaries',()=>{
  assert.match(app,/t\.isReminder\|\|t\.isTransferReconciled/);
  assert.match(app,/!t\.isTransferReconciled/);
});


test("Wealth overview includes financial total, four categories, performance and combined Others subtypes", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
  for (const id of ["wealthFinancialTotal", "wealthInvested", "wealthCurrentValue", "wealthGain", "wealthXirr", "wealthAllocationBar", "accountList"]) assert.match(html, new RegExp(`id=\"${id}\"`));
  for (const category of ["Mutual Funds", "Stocks", "ETFs", "Others"]) assert.match(html, new RegExp(`data-investment-category=\"${category}\"`));
  for (const subtype of ["Bank Deposit / RD", "Fixed Deposit", "Sovereign Gold Bond", "Other Asset"]) assert.ok(html.includes(subtype));
  assert.match(app, /calculatePortfolioXirr/);
  assert.match(app, /wealthFinancialTotal/);
});
