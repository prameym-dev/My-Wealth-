const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Core=require('../finance-core.js');

const ecasText=fs.readFileSync(path.join(__dirname,'fixtures','ecas-mini.txt'),'utf8');

test('CDSL eCAS parser extracts MF, demat, ETF and REIT holdings and reconciles all totals',()=>{
  const r=Core.parseEcasText(ecasText);
  assert.equal(r.mutualFunds.length,2);
  assert.equal(r.demat.length,3);
  assert.equal(r.historical.length,2);
  assert.equal(r.summary.total,500);
  assert.equal(r.parsedTotals['Mutual Funds'],400);
  assert.equal(r.parsedTotals.Stocks,70);
  assert.equal(r.parsedTotals.ETFs,20);
  assert.equal(r.parsedTotals.Others,10);
  assert.equal(r.checks.mutualFundTotalDiff,0);
  assert.equal(r.checks.dematTotalDiff,0);
  assert.equal(r.valid,true);
});

test('eCAS import is idempotent and updates existing ISIN/folio rows instead of duplicating',()=>{
  const parsed=Core.parseEcasText(ecasText),state={investments:[],investmentTransactions:[],investmentSnapshots:[]};
  const first=Core.upsertEcasImport(state,parsed,(()=>{let n=0;return()=>`id-${++n}`;})());
  const count=state.investments.length;
  const second=Core.upsertEcasImport(state,parsed,(()=>{let n=100;return()=>`id-${++n}`;})());
  assert.equal(count,5);
  assert.equal(state.investments.length,5);
  assert.equal(first.added,5);
  assert.equal(second.added,0);
  assert.equal(second.updated,5);
  assert.equal(state.investmentSnapshots.length,2);
  assert.equal(state.investmentTransactions.length,1);
  assert.equal(state.investmentTransactions[0].holdingId,state.investments.find(h=>h.isin==='INF111111111').id);
  assert.equal(state.investmentTransactions[0].appliedToHolding,false);
});

test('historical transfer candidate detection requires opposite flows, different accounts and a close date',()=>{
  const tx=[
    {id:'out',kind:'Expense',amount:2500,date:'2026-10-01',accountId:'a',account:'Bank A',note:'Transfer to my wallet'},
    {id:'in',kind:'Income',amount:2500,date:'2026-10-01',accountId:'b',account:'Wallet',note:'Own account transfer'},
    {id:'same',kind:'Income',amount:2500,date:'2026-10-01',accountId:'a',account:'Bank A',note:'Interest'},
    {id:'far',kind:'Income',amount:2500,date:'2026-10-09',accountId:'b',account:'Wallet',note:'Transfer'}
  ];
  const c=Core.findHistoricalTransferCandidates(tx,{maxDays:1,minScore:65});
  assert.equal(c.length,1);
  assert.equal(c[0].expenseId,'out');
  assert.equal(c[0].incomeId,'in');
});

test('reconciliation preserves originals, converts balances once, and supports undo',()=>{
  const state={transactions:[
    {id:'out',kind:'Expense',amount:2500,date:'2026-10-01',accountId:'a',account:'Bank A'},
    {id:'in',kind:'Income',amount:2500,date:'2026-10-01',accountId:'b',account:'Wallet'}
  ]};
  const beforeA=Core.accountBalance({id:'a',openingBalance:10000},state.transactions);
  const beforeB=Core.accountBalance({id:'b',openingBalance:1000},state.transactions);
  const candidate=Core.findHistoricalTransferCandidates(state.transactions,{minScore:65})[0];
  const transfer=Core.reconcileTransferPair(state,candidate,()=> 'transfer-1');
  assert.equal(state.transactions.length,3);
  assert.equal(state.transactions.find(x=>x.id==='out').isTransferReconciled,true);
  assert.equal(Core.accountBalance({id:'a',openingBalance:10000},state.transactions),beforeA);
  assert.equal(Core.accountBalance({id:'b',openingBalance:1000},state.transactions),beforeB);
  assert.equal(transfer.kind,'Transfer');
  assert.equal(Core.undoTransferReconciliation(state,'transfer-1'),true);
  assert.equal(state.transactions.length,2);
  assert.equal(state.transactions.every(x=>!x.isTransferReconciled),true);
});

test('same-account and mismatched amount transactions are not transfer candidates',()=>{
  const tx=[
    {id:'a',kind:'Expense',amount:100,date:'2026-10-01',accountId:'same',note:'Transfer'},
    {id:'b',kind:'Income',amount:100,date:'2026-10-01',accountId:'same',note:'Transfer'},
    {id:'c',kind:'Income',amount:101,date:'2026-10-01',accountId:'other',note:'Transfer'},
    {id:'d',kind:'Expense',amount:100,date:'2026-10-01',accountId:'a',transferGroupId:44,note:'Already paired'},
    {id:'e',kind:'Income',amount:100,date:'2026-10-01',accountId:'b',transferGroupId:44,note:'Already paired'}
  ];
  assert.equal(Core.findHistoricalTransferCandidates(tx,{minScore:65}).length,0);
});

test('Bluecoins import maps accounts, preserves transfer metadata and skips duplicate source IDs',()=>{
  const state={accounts:[],transactions:[]};
  const payload={source:'Bluecoins',accounts:[
    {accountsTableID:2,accountName:'SBI',accountTypeID:3},
    {accountsTableID:3,accountName:'Wallet',accountTypeID:4},
    {accountsTableID:-1,accountName:'(No Account)',accountTypeID:0}
  ],transactions:[
    {sourceId:100,date:'2026-10-01',amount:12500000,type:'Expense',accountId:2,account:'SBI',category:'Food',description:'Lunch',isReminder:false},
    {sourceId:101,date:'2026-10-02',amount:5000000,type:'Transfer',accountId:2,account:'SBI',counterAccountId:3,counterAccount:'Wallet',transferGroupId:101,category:'(Transfer)',description:'Transfer',isReminder:false}
  ]};
  let n=0;const makeId=()=>`blue-${++n}`;
  const first=Core.upsertBluecoinsImport(state,payload,makeId);
  const second=Core.upsertBluecoinsImport(state,payload,makeId);
  assert.equal(first.accountsAdded,2);
  assert.equal(first.transactionsAdded,2);
  assert.equal(second.transactionsAdded,0);
  assert.equal(second.duplicates,2);
  assert.equal(state.transactions.length,2);
  const transfer=state.transactions.find(t=>t.kind==='Transfer');
  assert.equal(transfer.counterAccount,'Wallet');
  assert.equal(state.transactions[0].amount,1250);
  assert.equal(state.transactions[0].sourceAmountRaw,12500000);
  assert.equal(state.transactions[0].amountScaleCorrected,true);
  assert.equal(transfer.amount,500);
  assert.equal(transfer.transferGroupId,101);
});

test('manual investment purchase and redemption apply reversible cost, value and unit deltas',()=>{
  const state={investments:[{id:'holding',cost:800,value:1000,units:10}]};
  const purchase={id:'p1',holdingId:'holding',type:'Purchase',amount:500,units:5,source:'Manual'};
  Core.applyInvestmentTransaction(state,purchase,1);
  assert.deepEqual(state.investments[0],{id:'holding',cost:1300,value:1500,units:15});
  Core.applyInvestmentTransaction(state,purchase,-1);
  assert.deepEqual(state.investments[0],{id:'holding',cost:800,value:1000,units:10});
  const redemption={id:'r1',holdingId:'holding',type:'Redemption',amount:300,units:3,source:'Manual'};
  Core.applyInvestmentTransaction(state,redemption,1);
  assert.equal(state.investments[0].units,7);
  assert.equal(state.investments[0].value,700);
  assert.equal(state.investments[0].cost,560);
  Core.applyInvestmentTransaction(state,redemption,-1);
  assert.deepEqual(state.investments[0],{id:'holding',cost:800,value:1000,units:10});
});

test('manual investment switch moves value and cost basis between holdings and is reversible',()=>{
  const state={investments:[
    {id:'from',cost:600,value:800,units:8},
    {id:'to',cost:200,value:250,units:2}
  ]};
  const tx={id:'switch-1',holdingId:'from',toHoldingId:'to',type:'Switch',amount:400,units:4,toUnits:3,source:'Manual'};
  assert.equal(Core.applyInvestmentTransaction(state,tx,1),true);
  assert.equal(state.investments[0].units,4);
  assert.equal(state.investments[0].value,400);
  assert.equal(state.investments[0].cost,300);
  assert.equal(state.investments[1].units,5);
  assert.equal(state.investments[1].value,650);
  assert.equal(state.investments[1].cost,500);
  Core.applyInvestmentTransaction(state,tx,-1);
  assert.deepEqual(state.investments,[{id:'from',cost:600,value:800,units:8},{id:'to',cost:200,value:250,units:2}]);
});
