(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.MyWealthCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const ISIN_RE=/IN[EF][A-Z0-9]{8}\d/g;
  const NUM_RE=/-?\d[\d,]*(?:\.\d+)?/g;
  const toNum=v=>Number(String(v??"").replace(/,/g,""))||0;
  const normDate=v=>String(v||"").slice(0,10);
  const dayDiff=(a,b)=>Math.abs((Date.parse(normDate(a)+"T00:00:00Z")-Date.parse(normDate(b)+"T00:00:00Z"))/86400000);
  function transferText(t){return [t.category,t.note,t.notes,t.description,t.payee,t.counterAccount].filter(Boolean).join(" ").toLowerCase();}
  function findHistoricalTransferCandidates(transactions,options={}){
    const maxDays=Number.isFinite(options.maxDays)?options.maxDays:1;
    const minScore=Number.isFinite(options.minScore)?options.minScore:55;
    const rows=(transactions||[]).filter(t=>!t.isReminder&&!t.isTransferReconciled&&!t.reconciledToTransferId&&!t.transferCandidateDismissed&&!(Number(t.transferGroupId)||0)&&["Income","Expense"].includes(t.kind)&&toNum(t.amount)>0&&t.accountId!==null&&t.accountId!==undefined&&String(t.accountId)!=="");
    const candidates=[];
    for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
      const a=rows[i],b=rows[j];if(a.kind===b.kind)continue;
      if(String(a.accountId)===String(b.accountId))continue;
      const amountA=Math.abs(toNum(a.amount)),amountB=Math.abs(toNum(b.amount));
      const tolerance=Math.max(.01,Math.max(amountA,amountB)*.00001);
      if(Math.abs(amountA-amountB)>tolerance)continue;
      const days=dayDiff(a.date,b.date);if(!Number.isFinite(days)||days>maxDays)continue;
      const exp=a.kind==="Expense"?a:b,inc=a.kind==="Income"?a:b;
      const text=(transferText(exp)+" "+transferText(inc)).toLowerCase();
      const strong=/(self\s*transfer|own\s*account|account\s*transfer|fund\s*transfer|transfer|imps|neft|rtgs|upi|wallet\s*load|to\s*(?:my|own)|from\s*(?:my|own))/.test(text);
      const accountNamesMatch=String(exp.account||"").trim().toLowerCase()!==String(inc.account||"").trim().toLowerCase();
      let score=35+(days===0?25:15)+(strong?30:0)+(accountNamesMatch?10:0);
      if(exp.category&&/transfer/i.test(exp.category))score+=10;
      if(inc.category&&/transfer/i.test(inc.category))score+=10;
      if(exp.sourceId&&inc.sourceId&&String(exp.sourceId)===String(inc.sourceId))score+=25;
      score=Math.min(100,score);
      if(score<minScore)continue;
      candidates.push({id:[String(exp.id),String(inc.id)].sort().join("::"),expenseId:exp.id,incomeId:inc.id,expense:exp,income:inc,amount:amountA,date:exp.date,daysApart:days,score,reason:strong?"Transfer wording or payment rail found":"Matching amount, nearby date and different accounts"});
    }
    candidates.sort((a,b)=>b.score-a.score||a.daysApart-b.daysApart||String(b.date).localeCompare(String(a.date)));
    const used=new Set();return candidates.filter(c=>{if(used.has(String(c.expenseId))||used.has(String(c.incomeId)))return false;used.add(String(c.expenseId));used.add(String(c.incomeId));return true;});
  }
  function reconcileTransferPair(state,candidate,makeId){
    const exp=state.transactions.find(t=>String(t.id)===String(candidate.expenseId));
    const inc=state.transactions.find(t=>String(t.id)===String(candidate.incomeId));
    if(!exp||!inc||exp.kind!=="Expense"||inc.kind!=="Income")throw Error("The original candidate transactions are no longer available.");
    if(exp.isTransferReconciled||inc.isTransferReconciled)throw Error("One of these transactions has already been reconciled.");
    if(String(exp.accountId)===String(inc.accountId))throw Error("A self-transfer must move between two different accounts.");
    const transferId=makeId();
    const transfer={id:transferId,date:exp.date<=inc.date?exp.date:inc.date,amount:Math.abs(Number(exp.amount)),kind:"Transfer",category:"Self transfer",note:[exp.note,inc.note].filter(Boolean).join(" / ")||"Historical transfer reconciled",accountId:exp.accountId,account:exp.account||"",counterAccountId:inc.accountId,counterAccount:inc.account||"",transferGroupId:transferId,source:"Historical reconciliation",reconciledFromIds:[exp.id,inc.id],reconciledAt:new Date().toISOString()};
    exp.isTransferReconciled=true;exp.reconciledToTransferId=transferId;inc.isTransferReconciled=true;inc.reconciledToTransferId=transferId;
    state.transactions.push(transfer);return transfer;
  }
  function undoTransferReconciliation(state,transferId){
    const t=state.transactions.find(x=>String(x.id)===String(transferId)&&x.source==="Historical reconciliation");
    if(!t)return false;
    for(const originalId of (t.reconciledFromIds||[])){const original=state.transactions.find(x=>String(x.id)===String(originalId));if(original){delete original.isTransferReconciled;delete original.reconciledToTransferId;}}
    state.transactions=state.transactions.filter(x=>String(x.id)!==String(transferId));return true;
  }
  function accountBalance(account,transactions){
    let bal=Number(account.openingBalance)||0;
    for(const t of transactions||[]){
      if(t.isReminder||t.isTransferReconciled||Number(t.deletedFlag)===5)continue;
      if(String(t.accountId)!==String(account.id)){
        // Bluecoins exports each side of a transfer as its own linked row.
        // Its paired row applies the movement to the other account.
        if(t.kind==="Transfer"&&t.source!=="Bluecoins"&&String(t.counterAccountId)===String(account.id))bal+=Math.abs(toNum(t.amount));
        continue;
      }
      const amount=Math.abs(toNum(t.amount));
      if(t.source==="Bluecoins"&&t.sourceAmountRaw!==undefined&&Number(t.sourceAmountRaw)!==0){
        // Bluecoins' signed source amount is authoritative for every transaction
        // type, including refunds/reversals whose sign can differ from the type.
        bal+=Math.sign(Number(t.sourceAmountRaw))*amount;
      }else if(t.kind==="Transfer")bal-=amount;
      else if(t.kind==="Income")bal+=amount;
      else if(t.kind==="Expense")bal-=amount;
    }
    return bal;
  }
  function applyInvestmentTransaction(state,tx,direction=1){
    if(tx.source==="eCAS"||tx.appliedToHolding===false)return false;
    const h=(state.investments||[]).find(x=>String(x.id)===String(tx.holdingId));if(!h)return false;
    const destination=tx.type==="Switch"?(state.investments||[]).find(x=>String(x.id)===String(tx.toHoldingId)):null;
    if(tx.type==="Switch"&&(!destination||String(destination.id)===String(h.id)))return false;
    if(direction===-1){h.cost=Math.max(0,(Number(h.cost)||0)-Number(tx.costDelta||0));h.value=Math.max(0,(Number(h.value)||0)-Number(tx.valueDelta||0));h.units=Math.max(0,(Number(h.units)||0)-Number(tx.unitsDelta||0));if(destination){destination.cost=Math.max(0,(Number(destination.cost)||0)-Number(tx.toCostDelta||0));destination.value=Math.max(0,(Number(destination.value)||0)-Number(tx.toValueDelta||0));destination.units=Math.max(0,(Number(destination.units)||0)-Number(tx.toUnitsDelta||0));}return true;}
    const amount=Math.abs(Number(tx.amount)||0),units=Math.abs(Number(tx.units)||0),type=tx.type;let costDelta=0,valueDelta=0,unitsDelta=0;
    if(["Purchase","SIP","Bonus"].includes(type)){costDelta=type==="Bonus"?0:amount;valueDelta=type==="Bonus"?0:amount;unitsDelta=units;}
    else if(type==="Redemption"||type==="Switch"){const currentUnits=Number(h.units)||0,frac=units>0&&currentUnits>0?Math.min(1,units/currentUnits):Math.min(1,amount/Math.max(1,Number(h.value)||1));costDelta=-(Number(h.cost)||0)*frac;valueDelta=-amount;unitsDelta=-units;}
    else if(type==="Fee"){valueDelta=-amount;}
    tx.costDelta=costDelta;tx.valueDelta=valueDelta;tx.unitsDelta=unitsDelta;h.cost=Math.max(0,(Number(h.cost)||0)+costDelta);h.value=Math.max(0,(Number(h.value)||0)+valueDelta);h.units=Math.max(0,(Number(h.units)||0)+unitsDelta);
    if(destination){const toCostDelta=-costDelta,toValueDelta=amount,toUnitsDelta=Math.abs(Number(tx.toUnits)||0);tx.toCostDelta=toCostDelta;tx.toValueDelta=toValueDelta;tx.toUnitsDelta=toUnitsDelta;destination.cost=Math.max(0,(Number(destination.cost)||0)+toCostDelta);destination.value=Math.max(0,(Number(destination.value)||0)+toValueDelta);destination.units=Math.max(0,(Number(destination.units)||0)+toUnitsDelta);}
    tx.appliedToHolding=true;return true;
  }
  function parseEcasText(input){
    const text=String(input||"").replace(/-\s*\n\s*/g,"").replace(/\r/g,"");
    if(!/CONSOLIDATED ACCOUNT STATEMENT/i.test(text)||!/CAS/i.test(text))throw Error("This does not look like a supported CDSL eCAS statement.");
    const first=(re)=>{const m=text.match(re);return m?m[1]:null;};
    const moneyVal=s=>toNum(s);
    const total=moneyVal(first(/Total Portfolio Value\s*₹?\s*([\d,]+\.\d{2})/i)||first(/Total Portfolio Value\s+([\d,]+\.\d{2})/i));
    const summary={total,demat:moneyVal(first(/CDSL Demat Accounts\s+([\d,]+\.\d{2})/i)),mutualFunds:moneyVal(first(/Mutual Fund Folios\s+([\d,]+\.\d{2})/i)),equity:0,dematMutualFunds:0,others:0};
    const classStart=text.indexOf("Consolidated Portfolio for Accounts"),classSection=classStart>=0?text.slice(classStart,classStart+2200):text;
    summary.equity=moneyVal(firstFrom(classSection,/Equity\s+([\d,]+\.\d{2})/i));
    summary.dematMutualFunds=moneyVal(firstFrom(classSection,/Mutual Funds Held in Demat Form\s+([\d,]+\.\d{2})/i));
    summary.others=moneyVal(firstFrom(classSection,/Others\s+([\d,]+\.\d{2})/i));
    const statementDate=first(/Statement for the period from\s+\d{2}-[A-Za-z]{3}-\d{4}\s+to\s+(\d{2}-[A-Za-z]{3}-\d{4})/i)||first(/as on\s+(\d{2}-\d{2}-\d{4})/i);
    const isoDate=statementDate?parseCasDate(statementDate):new Date().toISOString().slice(0,10);
    const casId=first(/CAS ID:\s*([A-Z0-9]+)/i)||"CDSL-CAS";
    const mfStart=text.search(/MUTUAL FUND UNITS HELD AS ON/i),mfEnd=mfStart>=0?text.indexOf("Grand Total",mfStart):-1;
    if(mfStart<0||mfEnd<0)throw Error("The statement is missing the mutual-fund valuation table.");
    const mfSection=text.slice(mfStart,mfEnd);
    const schemeByCode=new Map();
    const schemeRe=/Scheme Name\s*:\s*([\s\S]*?)\s+Scheme Code\s*:\s*([A-Z0-9]+)/gi;
    for(const m of text.matchAll(schemeRe)){
      const tail=text.slice(m.index+m[0].length,m.index+m[0].length+700),isin=tail.match(/ISIN\s*:\s*(INF[A-Z0-9]{9})/i),folio=tail.match(/Folio No\s*:\s*([A-Z0-9/]+)/i);
      if(isin){const meta={isin:isin[1],name:m[1].replace(/\s+/g," ").trim(),schemeCode:m[2],folio:folio?.[1]||""};if(!schemeByCode.has(m[2]))schemeByCode.set(m[2],[]);schemeByCode.get(m[2]).push(meta);}
    }
    const codeList=[...schemeByCode.keys()].sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
    const rowRe=new RegExp("(?:^|\\n)\\s*("+codeList.join("|")+")\\s*-\\s*","gm"),rowMatches=[...mfSection.matchAll(rowRe)],mutualFunds=[];
    for(let i=0;i<rowMatches.length;i++){
      const m=rowMatches[i],code=m[1],startAt=m.index+m[0].length,chunk=mfSection.slice(startAt,rowMatches[i+1]?.index??mfSection.length),metaRows=schemeByCode.get(code)||[];
      const rowIsin=chunk.match(/INF[A-Z0-9]{9}/)?.[0],rowFolio=metaRows.find(x=>x.folio&&chunk.includes(x.folio)),meta=(metaRows.find(x=>x.isin===rowIsin)||rowFolio||metaRows[i]||metaRows[0]||{});
      const decimals=[];for(const line of chunk.split("\n")){decimals.push(...(line.match(/-?\d[\d,]*\.\d+/g)||[]));if(decimals.length>=6)break;}
      const v=decimals.slice(0,6).map(toNum);if(v.length<6)continue;
      mutualFunds.push({category:"Mutual Funds",name:meta.name||chunk.split("\n").slice(0,2).join(" ").trim()||code,isin:rowIsin||meta.isin||"",schemeCode:code,folio:meta.folio||rowFolio?.folio||"",units:v[0],nav:v[1],cost:v[2],value:v[3],gain:v[4],returnPct:v[5],date:isoDate,source:"eCAS"});
    }
    const dematStart=text.search(/HOLDING STATEMENT AS ON/i),dematEnd=dematStart>=0?text.indexOf("MUTUAL FUND UNITS HELD WITH MF\/RTA",dematStart):-1;
    if(dematStart<0||dematEnd<0)throw Error("The statement is missing the demat holding tables.");
    const dematSection=text.slice(dematStart,dematEnd),lines=dematSection.split("\n");
    const isinRe=/IN[EF][A-Z0-9]{8}\d/g,decimalRe=/-?\d[\d,]*\.\d+/g,demat=[];
    let activeDp="Unknown demat account",activeBo="";
    const priorDp=text.slice(0,dematStart).match(/DP Name\s*:\s*(.+?)(?:\s{2,}|\s+BO ID\s*:|\n|$)/i);
    if(priorDp)activeDp=priorDp[1].trim();
    const priorBo=text.slice(0,dematStart).match(/BO ID\s*:\s*(\d+)/i);if(priorBo)activeBo=priorBo[1];
    for(let i=0;i<lines.length;i++){
      const dp=lines[i].match(/DP Name\s*:\s*(.+?)(?:\s{2,}|\s+BO ID\s*:|\s+DP ID\s*:|$)/i);
      if(dp){activeDp=dp[1].trim();const bo=lines.slice(i,i+3).join(" ").match(/BO ID\s*:\s*(\d+)/i)||lines.slice(i,i+3).join(" ").match(/Client ID\s*:\s*(\d+)/i);activeBo=bo?.[1]||"";}
      for(const m of lines[i].matchAll(isinRe)){
        let rowLine=-1,vals=[];
        for(let j=i;j<Math.min(lines.length,i+10);j++){
          if(j>i&&/IN[EF][A-Z0-9]{8}\d/.test(lines[j]))break;
          const found=lines[j].match(decimalRe)||[];
          if(found.length>=4){rowLine=j;vals=found.slice(-4).map(toNum);break;}
        }
        if(rowLine<0)continue;
        const name=[lines[i-1]||"",lines[i],lines[i+1]||""].join(" ").replace(/\s+/g," ").trim();
        const upper=name.toUpperCase();let category="Stocks";
        if(m[0].startsWith("INF")||(/\bETF\b/.test(upper)&&!/^INE/.test(m[0])))category="ETFs";
        else if(/\bREIT\b|\bINVIT\b|INFRASTRUCTURE INVESTMENT TRUST/.test(upper))category="Others";
        const [units,,price,value]=vals;
        demat.push({category,name:name||m[0],isin:m[0],units,price,cost:null,value,account:activeDp,boId:activeBo,date:isoDate,source:"eCAS"});
      }
    }
    const byCategory={"Mutual Funds":mutualFunds,"Stocks":[],"ETFs":[],"Others":[]};
    demat.forEach(h=>byCategory[h.category].push(h));
    const totals={"Mutual Funds":summary.mutualFunds,"Stocks":summary.equity,"ETFs":summary.dematMutualFunds,"Others":summary.others};
    const parsedTotals={"Mutual Funds":mutualFunds.reduce((s,h)=>s+h.value,0),"Stocks":byCategory.Stocks.reduce((s,h)=>s+h.value,0),"ETFs":byCategory.ETFs.reduce((s,h)=>s+h.value,0),"Others":byCategory.Others.reduce((s,h)=>s+h.value,0)};
    const dematTotal=demat.reduce((s,h)=>s+h.value,0),mfTotal=mutualFunds.reduce((s,h)=>s+h.value,0);
    const checks={mutualFundCount:mutualFunds.length,dematHoldingCount:demat.length,mutualFundTotalDiff:Math.abs(mfTotal-summary.mutualFunds),dematTotalDiff:Math.abs(dematTotal-summary.demat),portfolioTotalDiff:Math.abs(mfTotal+dematTotal-summary.total),categoryDiffs:Object.fromEntries(Object.keys(totals).map(k=>[k,Math.abs(parsedTotals[k]-totals[k])]))};
    const valid=summary.total>0&&checks.mutualFundTotalDiff<1&&checks.dematTotalDiff<1&&checks.portfolioTotalDiff<1&&Object.values(checks.categoryDiffs).every(v=>v<1);
    if(!valid)throw Object.assign(Error("eCAS reconciliation failed. Nothing was imported. Parsed holdings do not match the statement totals."),{checks,summary,parsedTotals,mutualFundCount:mutualFunds.length,dematHoldingCount:demat.length});
    const historical=[];const histSection=text.match(/Consolidated Portfolio Valuation for Year([\s\S]*?)(?:Consolidated Portfolio for Accounts|$)/i)?.[1]||"";
    const monthMap={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
    for(const m of histSection.matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\s+([\d,]+\.\d{2})/g)){const mm=monthMap[m[1]];historical.push({date:`${m[2]}-${String(mm).padStart(2,"0")}-${String(new Date(Number(m[2]),mm,0).getDate()).padStart(2,"0")}`,value:toNum(m[3]),source:"eCAS history"});}
    const mfTxSection=text.match(/MUTUAL FUND UNITS HELD WITH MF\/RTA([\s\S]*?)MUTUAL FUND UNITS HELD AS ON/i)?.[1]||"";
    const investmentTransactions=[];
    const txRe=/\b(\d{2}-\d{2}-\d{4})\b([\s\S]{0,240}?)(?=\b\d{2}-\d{2}-\d{4}\b|Closing Balance|$)/g;
    for(const m of mfTxSection.matchAll(txRe)){
      const nums=(m[2].match(/(?<![A-Za-z])\d[\d,]*\.\d+/g)||[]).map(toNum);
      if(nums.length<4)continue;
      const description=m[2].replace(/[\d,]+\.\d+/g," ").replace(/\s+/g," ").trim();
      investmentTransactions.push({date:parseCasDate(m[1]),type:/redemption|switch.?out/i.test(description)?"Redemption":/dividend/i.test(description)?"Dividend":"Purchase",description,amount:nums[0],nav:nums[1],units:nums[3],source:"eCAS",isin:(mfTxSection.slice(0,m.index).match(/ISIN\s*:\s*(INF[A-Z0-9]{9})/gi)||[]).slice(-1)[0]?.split(":").pop().trim()||""});
    }
    return {casId,date:isoDate,summary,mutualFunds,demat,byCategory,parsedTotals,checks,historical,investmentTransactions,valid:true};
  }
  function firstFrom(s,re){const m=String(s||"").match(re);return m?m[1]:null;}
  function parseCasDate(s){const m=String(s).match(/(\d{2})-([A-Za-z]{3}|\d{2})-(\d{4})/);if(!m)return new Date().toISOString().slice(0,10);const months={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};const mo=/^\d{2}$/.test(m[2])?Number(m[2]):months[m[2]];return `${m[3]}-${String(mo).padStart(2,"0")}-${m[1]}`;}
  function normalizeBluecoinsDate(value){
    const raw=String(value??"").trim();
    if(!raw)return "";
    // Bluecoins SQLite stores local timestamps as YYYY-MM-DD HH:mm:ss.
    // Safari's Date parser rejects this space-separated form on some iOS versions.
    const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
    if(m)return `${m[1]}-${m[2]}-${m[3]}`;
    const d=new Date(raw);
    return Number.isNaN(d.getTime())?"":`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function isBluecoinsOpeningBalanceTransaction(t){
    return !!t && t.source==="Bluecoins" && (Number(t.sourceTypeId)===2 || String(t.category||t.sourceCategory||"").trim().toLowerCase()==="(new account)" || String(t.sourceParentCategory||"").trim().toLowerCase()==="(new account)");
  }
  function bluecoinsLiabilityAccount(account){
    if(!account)return false;
    const typeId=Number(account.sourceAccountTypeId);
    if([2,8,9,10,11,13].includes(typeId))return true;
    if([1,3,4,5,6,7,12,15,16].includes(typeId))return false;
    const type=String(account.type||"").toLowerCase(),name=String(account.name||"").toLowerCase();
    return /credit|liabilit|loan|payable|mortgage/.test(type) || /\b(cc|zip|paylater|postpaid)\b/.test(name);
  }
  // Bluecoins source amounts are normalized using the app's 10,000 divisor.
  // Re-derive from preserved raw values so older backups made with the wrong
  // divisor are repaired on restore; safe to run repeatedly.
  function normalizeBluecoinsAmounts(state){
    if(!state||!Array.isArray(state.transactions))return {corrected:0};
    let corrected=0;
    for(const t of state.transactions){
      if(t.source!=="Bluecoins"||t.sourceAmountRaw===undefined||t.sourceAmountRaw===null)continue;
      const amount=Math.abs(toNum(t.sourceAmountRaw))/10000;
      if(!Number.isFinite(amount))continue;
      if(Number(t.amount)!==amount||t.amountScaleCorrected!==true){t.amount=amount;t.amountScaleCorrected=true;corrected++;}
    }
    if(corrected)state.bluecoinsMeta={...(state.bluecoinsMeta||{}),amountScaleCorrectedAt:new Date().toISOString()};
    return {corrected};
  }
  function migrateBluecoinsOpeningBalances(state){
    if(!state||!Array.isArray(state.transactions))return {migrated:0,amount:0};
    state.accounts=Array.isArray(state.accounts)?state.accounts:[];
    let migrated=0,total=0;
    const keep=[];
    for(const t of state.transactions){
      if(!isBluecoinsOpeningBalanceTransaction(t)){keep.push(t);continue;}
      const account=state.accounts.find(a=>String(a.id)===String(t.accountId)) || state.accounts.find(a=>String(a.name||"").trim().toLowerCase()===String(t.account||"").trim().toLowerCase());
      if(!account){keep.push(t);continue;}
      const amount=Math.abs(toNum(t.amount));
      const raw=t.sourceAmountRaw!==undefined?toNum(t.sourceAmountRaw):0;
      const signed=raw!==0?Math.sign(raw)*amount:amount;
      account.openingBalance=toNum(account.openingBalance)+signed;
      account.bluecoinsOpeningBalanceSourceIds=Array.isArray(account.bluecoinsOpeningBalanceSourceIds)?account.bluecoinsOpeningBalanceSourceIds:[];
      if(t.sourceId!==undefined&&t.sourceId!==null)account.bluecoinsOpeningBalanceSourceIds.push(String(t.sourceId));
      account.bluecoinsOpeningBalanceScale=10000;
      migrated++;total+=amount;
    }
    state.transactions=keep;
    if(migrated)state.bluecoinsMeta={...(state.bluecoinsMeta||{}),openingBalanceMigration:{migrated,amount:total,at:new Date().toISOString()}};
    return {migrated,amount:total};
  }
  function reminderGroupKey(src){
    const group=src?.source?.reminderGroupID??src?.reminderMeta?.groupId??src?.reminderGroupId;
    return group!==undefined&&group!==null&&String(group)!=="0"?String(group):[src?.accountId??src?.account,src?.category,src?.description??src?.note,src?.reminderMeta?.frequency??"monthly"].map(x=>String(x??"").trim().toLowerCase()).join("|");
  }
  function upsertBluecoinsReminderSchedules(state,payload,makeId,accountMap=null){
    state.reminders=Array.isArray(state.reminders)?state.reminders:[];
    const groups=new Map();
    for(const src of (payload?.transactions||[])){
      if(!src?.isReminder||Number(src.deletedFlag)===5)continue;
      const key=reminderGroupKey(src);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(src);
    }
    let added=0;
    for(const [key,rows] of groups){
      if(state.reminders.some(r=>String(r.sourceGroupId??"")===key||r.sourceKey===`bluecoins-reminder:${key}`))continue;
      rows.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const first=rows[0],raw=toNum(first.amount),amount=Math.abs(raw)/10000;
      const frequency=Number(first.source?.reminderFrequency??first.reminderMeta?.frequency);
      const recurrence=frequency===1?"daily":frequency===2?"weekly":frequency===3?"weekly":frequency===4?"monthly":frequency===5?"quarterly":frequency===6?"yearly":"monthly";
      state.reminders.push({id:makeId(),source:"Bluecoins reminder",sourceKey:`bluecoins-reminder:${key}`,sourceGroupId:key,title:first.description||first.note||first.category||"Bluecoins reminder",type:String(first.category||"").toLowerCase()==="investment (buy)"?"mf":"bill",amount, dueDate:normDate(first.date),recurrence,category:first.category||"Other",accountId:accountMap?.get(String(first.accountId))?.id??first.accountId??null,leadDays:0,active:true,paidOccurrences:[],sourceOccurrenceCount:rows.length});added++;
    }
    return added;
  }
  function restoreReminderSchedulesFromTransactions(state,makeId){
    state.reminders=Array.isArray(state.reminders)?state.reminders:[];
    const groups=new Map();
    for(const tx of (state.transactions||[])){
      if(!tx?.isReminder||Number(tx.deletedFlag)===5)continue;
      const key=reminderGroupKey(tx);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(tx);
    }
    let added=0;
    for(const [key,rows] of groups){
      if(state.reminders.some(r=>String(r.sourceGroupId??"")===key||r.sourceKey===`bluecoins-reminder:${key}`))continue;
      rows.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const first=rows[0],meta=first.reminderMeta||{},raw=first.sourceAmountRaw;
      const amount=Number.isFinite(Number(first.amount))?Math.abs(Number(first.amount)):Math.abs(toNum(raw))/10000;
      const f=Number(meta.frequency),recurrence=f===2||f===3?"weekly":f===5?"quarterly":f===6?"yearly":"monthly";
      state.reminders.push({id:makeId(),source:"Bluecoins reminder",sourceKey:`bluecoins-reminder:${key}`,sourceGroupId:key,title:first.note||first.description||first.category||"Bluecoins reminder",type:String(first.category||first.sourceCategory||"").toLowerCase()==="investment (buy)"?"mf":"bill",amount,dueDate:normDate(first.date),recurrence,category:first.category||first.sourceCategory||"Other",accountId:first.accountId??null,leadDays:0,active:true,paidOccurrences:[],sourceOccurrenceCount:rows.length});added++;
    }
    return added;
  }
  function removeImportedBluecoinsMfReminders(state){
    if(!state||!Array.isArray(state.transactions))return 0;
    const before=state.transactions.length;
    state.transactions=state.transactions.filter(t=>!(t.source==="Bluecoins"&&t.isReminder===true&&String(t.category||t.sourceCategory||"").trim().toLowerCase()==="investment (buy)"&&String(t.account||"").trim().toLowerCase()==="sbi"&&String(t.note||"").trim().toLowerCase()==="mf"));
    return before-state.transactions.length;
  }
  // Legacy Bluecoins repair is a one-time compatibility migration, never part
  // of native My Wealth JSON restore. A native backup is an exact saved state:
  // preserve its opening balances, raw source rows and recurring reminders.
  function applyLegacyBluecoinsStartupMigrations(state){
    if(!state||!Array.isArray(state.transactions))return {skipped:false,corrected:0,migrated:0,removedReminders:0};
    if(state.myWealthRestore?.source==="json")return {skipped:true,corrected:0,migrated:0,removedReminders:0};
    const amounts=normalizeBluecoinsAmounts(state);
    const openings=migrateBluecoinsOpeningBalances(state);
    const removedReminders=removeImportedBluecoinsMfReminders(state);
    return {skipped:false,corrected:amounts.corrected,migrated:openings.migrated,removedReminders};
  }
  function upsertBluecoinsImport(state,payload,makeId){
    if(!payload||!Array.isArray(payload.transactions)||!Array.isArray(payload.accounts))throw Error("This is not a supported My Wealth Bluecoins migration JSON.");
    state.accounts=Array.isArray(state.accounts)?state.accounts:[];state.transactions=Array.isArray(state.transactions)?state.transactions:[];
    const accountMap=new Map();let accountsAdded=0;
    for(const src of payload.accounts){const sourceId=src.accountsTableID;if(sourceId===-1||sourceId===0)continue;let a=state.accounts.find(x=>String(x.sourceId)===String(sourceId))||state.accounts.find(x=>!x.sourceId&&String(x.name||"").toLowerCase()===String(src.accountName||"").toLowerCase());
      if(!a){const typeMap={1:"Other",2:"Liability",3:"Bank",4:"Wallet",5:"Investment",6:"Other",7:"Other",8:"Credit card",9:"Loan",10:"Payable",11:"Mortgage",12:"Other",13:"Liability",15:"Other",16:"Other"};a={id:makeId(),sourceId,name:src.accountName||"Imported account",type:typeMap[src.accountTypeID]||"Other",sourceAccountTypeId:Number(src.accountTypeID)||null,openingBalance:0,closed:false,source:"Bluecoins"};state.accounts.push(a);accountsAdded++;}else{a.sourceId=sourceId;a.sourceAccountTypeId=Number(src.accountTypeID)||a.sourceAccountTypeId||null;if(!a.name)a.name=src.accountName||"Imported account";}
      accountMap.set(String(sourceId),a);
    }
    // Repair opening balances imported by Build 07 (which incorrectly divided
    // raw values by 1,000,000). Bluecoins import uses 10,000; this repair is
    // deliberately confined to the Bluecoins import pipeline.
    const openingBySourceId=new Map();
    for(const src of payload.transactions){
      const sourceId=src.sourceId??src.source?.transactionsTableID;
      const isOpening=String(src.type||"").trim().toLowerCase()==="new account"||Number(src.transactionTypeID??src.source?.transactionTypeID)===2||String(src.category||"").trim().toLowerCase()==="(new account)";
      if(isOpening&&sourceId!==undefined)openingBySourceId.set(String(sourceId),toNum(src.amount));
    }
    for(const account of state.accounts){
      const ids=Array.isArray(account.bluecoinsOpeningBalanceSourceIds)?account.bluecoinsOpeningBalanceSourceIds:[];
      const raws=ids.map(id=>openingBySourceId.get(String(id))).filter(v=>v!==undefined);
      if(raws.length&&Number(account.bluecoinsOpeningBalanceScale)===1000000){const oldContribution=raws.reduce((sum,raw)=>sum+Math.sign(raw)*Math.abs(raw)/1000000,0);const correctContribution=raws.reduce((sum,raw)=>sum+Math.sign(raw)*Math.abs(raw)/10000,0);account.openingBalance=toNum(account.openingBalance)-oldContribution+correctContribution;account.bluecoinsOpeningBalanceScale=10000;}
    }
    const reminderSchedulesAdded=upsertBluecoinsReminderSchedules(state,payload,makeId,accountMap);
    const known=new Set(state.transactions.filter(t=>t.source==="Bluecoins"&&t.sourceId!==undefined).map(t=>String(t.sourceId)));
    for(const a of state.accounts)for(const sourceId of (a.bluecoinsOpeningBalanceSourceIds||[]))known.add(String(sourceId));
    let transactionsAdded=0,openingBalancesImported=0,duplicates=0;
    for(const src of payload.transactions){const sourceId=src.sourceId??src.source?.transactionsTableID;
      // Bluecoins' recurring MF reminder series is intentionally not migrated.
      // My Wealth will provide native recurring reminders in a future release.
      const isExcludedMfReminder=!!src.isReminder&&String(src.category||"").trim().toLowerCase()==="investment (buy)"&&String(src.account||"").trim().toLowerCase()==="sbi"&&String(src.note||src.description||src.notes||"").trim().toLowerCase()==="mf";
      if(isExcludedMfReminder){duplicates++;continue;}
      if(sourceId!==undefined&&known.has(String(sourceId))){
        // A repeat Bluecoins import is also the repair path for Build 07 rows
        // previously stored at the wrong 1,000,000 divisor.
        const existing=state.transactions.find(t=>t.source==="Bluecoins"&&String(t.sourceId)===String(sourceId));
        if(existing&&existing.sourceAmountRaw!==undefined){existing.amount=Math.abs(toNum(existing.sourceAmountRaw))/10000;existing.amountScaleCorrected=true;existing.sourceAmountDivisor=10000;}
        duplicates++;continue;
      }
      const from=accountMap.get(String(src.accountId));
      const isOpening=String(src.type||"").trim().toLowerCase()==="new account"||Number(src.transactionTypeID??src.source?.transactionTypeID)===2||String(src.category||"").trim().toLowerCase()==="(new account)";
      if(isOpening&&from){const sourceAmountRaw=toNum(src.amount),amount=Math.abs(sourceAmountRaw)/10000;from.openingBalance=toNum(from.openingBalance)+(sourceAmountRaw!==0?Math.sign(sourceAmountRaw)*amount:0);from.bluecoinsOpeningBalanceSourceIds=Array.isArray(from.bluecoinsOpeningBalanceSourceIds)?from.bluecoinsOpeningBalanceSourceIds:[];if(sourceId!==undefined)from.bluecoinsOpeningBalanceSourceIds.push(String(sourceId));from.bluecoinsOpeningBalanceScale=10000;if(sourceId!==undefined)known.add(String(sourceId));openingBalancesImported++;continue;}
      const kind=["Income","Expense","Transfer"].includes(src.type)?src.type:"Expense",to=accountMap.get(String(src.counterAccountId));
      const sourceAmountRaw=toNum(src.amount),amount=Math.abs(sourceAmountRaw)/10000;
      const tx={id:makeId(),source:"Bluecoins",sourceId:sourceId??null,sourceAmountRaw,amountScaleCorrected:true,sourceAmountDivisor:10000,date:normalizeBluecoinsDate(src.date),amount,kind,category:kind==="Transfer"?"Self transfer":(src.category||"Imported"),note:[src.description,src.notes].filter(Boolean).join(" · "),accountId:from?.id||null,account:from?.name||src.account||"",counterAccountId:kind==="Transfer"?(to?.id||null):null,counterAccount:kind==="Transfer"?(to?.name||src.counterAccount||""):"",transferGroupId:src.transferGroupId||null,isReminder:!!src.isReminder,deletedFlag:src.deletedFlag,labels:Array.isArray(src.labels)?src.labels:[],sourceCategory:src.category||"",sourceParentCategory:src.parentCategory||"",sourceTransferGroupId:src.transferGroupId||null,sourceTypeId:src.source?.transactionTypeID??null,sourceStatus:src.source?.status??null,sourceAccountReference:src.source?.accountReference??null,sourceTransactionCurrency:src.currency||src.source?.transactionCurrency||"INR",sourceConversionRate:src.source?.conversionRateNew??1,reminderMeta:src.isReminder?{groupId:src.source?.reminderGroupID??null,frequency:src.source?.reminderFrequency??null,repeatEvery:src.source?.reminderRepeatEvery??null,endingType:src.source?.reminderEndingType??null,startDate:src.source?.reminderStartDate??null,endDate:src.source?.reminderEndDate??null}:null};
      state.transactions.push(tx);if(sourceId!==undefined)known.add(String(sourceId));transactionsAdded++;
    }
    state.bluecoinsCategoryTree=payload.categories||state.bluecoinsCategoryTree||null;state.bluecoinsReferenceData=payload.referenceData||state.bluecoinsReferenceData||null;
    state.bluecoinsMeta={...(state.bluecoinsMeta||{}),source:payload.source||"Bluecoins",importedAt:new Date().toISOString(),lastImport:{accountsAdded,transactionsAdded,openingBalancesImported,duplicates,sourceCount:payload.transactions.length}};
    return {accountsAdded,transactionsAdded,openingBalancesImported,duplicates,reminderSchedulesAdded,sourceCount:payload.transactions.length};
  }
  function upsertEcasImport(state,parsed,makeId){
    state.investments=Array.isArray(state.investments)?state.investments:[];state.investmentTransactions=Array.isArray(state.investmentTransactions)?state.investmentTransactions:[];state.investmentSnapshots=Array.isArray(state.investmentSnapshots)?state.investmentSnapshots:[];
    const imported=[...parsed.mutualFunds,...parsed.demat];let added=0,updated=0;
    for(const h of imported){const sourceKey=h.category==="Mutual Funds"?`ecas:${h.isin}:${h.folio}`:`ecas:${h.boId||h.account}:${h.isin}`;const existing=state.investments.find(x=>x.sourceKey===sourceKey)||(h.category==="Mutual Funds"?state.investments.find(x=>x.isin===h.isin&&String(x.folio||"")===String(h.folio||"")):state.investments.find(x=>x.isin===h.isin&&String(x.account||"")===String(h.account||"")));
      const row={...h,id:existing?.id||makeId(),sourceKey,cost:h.cost??existing?.cost??null,updatedAt:new Date().toISOString()};if(existing){Object.assign(existing,row);updated++;}else{state.investments.push(row);added++;}}
    for(const tx of parsed.investmentTransactions){const key=`ecas:${parsed.casId}:${tx.isin}:${tx.date}:${tx.amount}:${tx.units}`;if(!state.investmentTransactions.some(x=>x.sourceKey===key)){state.investmentTransactions.push({...tx,id:makeId(),sourceKey:key,holdingId:state.investments.find(h=>String(h.isin||"")===String(tx.isin||""))?.id||null,appliedToHolding:false});}}
    for(const snap of parsed.historical){const key=`ecas:${parsed.casId}:${snap.date}`;if(!state.investmentSnapshots.some(x=>x.sourceKey===key))state.investmentSnapshots.push({...snap,id:makeId(),sourceKey:key});}
    const finalKey=`ecas:${parsed.casId}:${parsed.date}`;if(!state.investmentSnapshots.some(x=>x.sourceKey===finalKey))state.investmentSnapshots.push({id:makeId(),sourceKey:finalKey,date:parsed.date,value:parsed.summary.total,source:"eCAS total"});
    state.ecasMeta={casId:parsed.casId,date:parsed.date,summary:parsed.summary,checks:parsed.checks,importedAt:new Date().toISOString()};
    return {added,updated,transactions:parsed.investmentTransactions.length,snapshots:parsed.historical.length};
  }
  return {findHistoricalTransferCandidates,reconcileTransferPair,undoTransferReconciliation,accountBalance,normalizeBluecoinsDate,applyInvestmentTransaction,parseEcasText,upsertEcasImport,upsertBluecoinsImport,upsertBluecoinsReminderSchedules,restoreReminderSchedulesFromTransactions,removeImportedBluecoinsMfReminders,migrateBluecoinsOpeningBalances,normalizeBluecoinsAmounts,applyLegacyBluecoinsStartupMigrations,parseCasDate};
});
