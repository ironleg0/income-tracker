// App data
const exchangeRate = 0.2; // 1 RON = 0.2 EUR (example)
let income = []; // {desc,amount,curr,date}
let spend = [];
let chart; // Chart.js instance

function format(amount){ return Number(amount).toFixed(2); }
function todayISO(d){ return d || new Date().toISOString().split('T')[0]; }

const incomeList = document.getElementById('incomeList');
const spendList = document.getElementById('spendList');
const totalIncomeRON = document.getElementById('totalIncomeRON');
const totalSpendRON = document.getElementById('totalSpendRON');
const totalIncomeEUR = document.getElementById('totalIncomeEUR');
const totalSpendEUR = document.getElementById('totalSpendEUR');
const mainCurrency = document.getElementById('mainCurrency');

document.getElementById('addIncome').addEventListener('click', ()=> addEntry('income'));
document.getElementById('addSpend').addEventListener('click', ()=> addEntry('spend'));

function addEntry(type){
  if(type==='income'){
    const desc=document.getElementById('incomeDesc').value.trim();
    const amt=parseFloat(document.getElementById('incomeAmount').value);
    const curr=document.getElementById('incomeCurr').value;
    const date=document.getElementById('incomeDate').value || todayISO();
    if(!desc||isNaN(amt)||amt<0) return;
    income.push({desc,amount:amt,curr,date});
    renderList('income');
  } else {
    const desc=document.getElementById('spendDesc').value.trim();
    const amt=parseFloat(document.getElementById('spendAmount').value);
    const curr=document.getElementById('spendCurr').value;
    const date=document.getElementById('spendDate').value || todayISO();
    if(!desc||isNaN(amt)||amt<0) return;
    spend.push({desc,amount:amt,curr,date});
    renderList('spend');
  }
  updateTotals();
  updateChart();
  clearInputs();
}

function clearInputs(){
  ['incomeDesc','incomeAmount','incomeDate'].forEach(id=>document.getElementById(id).value='');
  ['spendDesc','spendAmount','spendDate'].forEach(id=>document.getElementById(id).value='');
}

function renderList(which){
  const isIncome = which==='income';
  const arr = isIncome?income:spend;
  const target = isIncome? incomeList: spendList;
  target.innerHTML='';
  arr.forEach((e,i)=>{
    const li=document.createElement('li');
    const left=document.createElement('div');
    left.innerHTML = `<strong>${e.desc}</strong> <span class="meta">${format(e.amount)} ${e.curr} • ${e.date}</span>`;
    const del=document.createElement('button');
    del.className='remove';
    del.textContent='Remove';
    del.onclick = ()=>{ if(isIncome){ income.splice(i,1);} else { spend.splice(i,1);} renderList(which); updateTotals(); updateChart(); };
    li.appendChild(left); li.appendChild(del);
    target.appendChild(li);
  });
}

function updateTotals(){
  let incRON=0, incEUR=0, spRON=0, spEUR=0;
  income.forEach(i=> i.curr==='RON'? incRON+=i.amount : incEUR+=i.amount);
  spend.forEach(s=> s.curr==='RON'? spRON+=s.amount : spEUR+=s.amount);
  totalIncomeRON.textContent = format(incRON);
  totalIncomeEUR.textContent = format(incEUR);
  totalSpendRON.textContent = format(spRON);
  totalSpendEUR.textContent = format(spEUR);
}

function updateChart(){
  const dates = Array.from(new Set([...income.map(i=>i.date), ...spend.map(s=>s.date)])).sort();
  let cumRON=0, cumEUR=0;
  const ronSeries = [], eurSeries = [];
  dates.forEach(d=>{
    income.filter(i=>i.date===d).forEach(x=> x.curr==='RON'? cumRON+=x.amount : cumEUR+=x.amount);
    spend.filter(s=>s.date===d).forEach(x=> x.curr==='RON'? cumRON-=x.amount : cumEUR-=x.amount);
    ronSeries.push(format(cumRON));
    eurSeries.push(format(cumEUR));
  });
  if(!chart){
    const ctx = document.getElementById('lineChart').getContext('2d');
    chart = new Chart(ctx, {
      type:'line',
      data:{ labels:dates, datasets:[{label:'RON balance', data:ronSeries, borderColor:'#2ecc71', fill:false},{label:'EUR balance', data:eurSeries, borderColor:'#3498db', fill:false}]},
      options:{responsive:true,scales:{y:{beginAtZero:true}}}
    });
  } else {
    chart.data.labels = dates;
    chart.data.datasets[0].data = ronSeries;
    chart.data.datasets[1].data = eurSeries;
    chart.update();
  }
}

document.getElementById('themeSelect').addEventListener('change', (e)=> document.body.className = e.target.value==='dark'? 'dark' : 'light');
document.getElementById('colorPicker').addEventListener('input', (e)=> document.documentElement.style.setProperty('--primary', e.target.value));
document.getElementById('exportPdf').addEventListener('click', async ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text('Income & Spending Report', 10, 12);
  doc.setFontSize(10); doc.text('Generated: ' + new Date().toLocaleString(), 10, 20);
  let y=30;
  doc.text('--- Income ---',10,y); y+=6;
  income.forEach(i=>{ doc.text(`${i.date} - ${i.desc}: ${format(i.amount)} ${i.curr}`,10,y); y+=6; if(y>270){doc.addPage(); y=10}});
  y+=6; doc.text('--- Spending ---',10,y); y+=6;
  spend.forEach(s=>{ doc.text(`${s.date} - ${s.desc}: ${format(s.amount)} ${s.curr}`,10,y); y+=6; if(y>270){doc.addPage(); y=10}});
  doc.save('income_spending_report.pdf');
});
