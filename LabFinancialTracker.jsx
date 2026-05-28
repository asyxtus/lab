import { useState, useReducer, useMemo, useEffect } from "react";
import {
  LayoutDashboard, TrendingUp, TrendingDown, FlaskConical, Receipt,
  FileText, Menu, X, ChevronDown, ChevronUp, Plus, Download, Edit2,
  Trash2, Search, Printer, Hospital, Calendar,
  ChevronLeft, ChevronRight, ArrowUpDown
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine
} from "recharts";

// ─────────────────────────────────────────────
// CONSTANTS & COLORS
// ─────────────────────────────────────────────
const COLORS = {
  navy: "#1B2A4A",
  blue: "#2E5FA3",
  teal: "#17A589",
  red: "#C0392B",
  gold: "#D4AC0D",
  bg: "#F2F4F6",
  card: "#FFFFFF",
  textPrimary: "#1B2A4A",
  textSecondary: "#5D6D7E",
};

const DEPT_COLORS = ["#2E5FA3","#17A589","#D4AC0D","#8E44AD","#E67E22","#C0392B","#1ABC9C"];
const DEPARTMENTS = ["Haematology","Biochemistry","Microbiology","Pathology","Immunology","Radiology","Other"];
const EXPENSE_CATS = ["Reagents & Supplies","Equipment Maintenance","Staff Salaries","Utilities","Lab Consumables","Quality Control","Admin & Overhead","Other"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─────────────────────────────────────────────
// SAMPLE DATA GENERATOR
// ─────────────────────────────────────────────
function generateSampleData() {
  const seasonality = [1.15,1.0,0.95,0.9,0.92,0.88,0.82,0.80,0.93,1.0,1.05,1.1];
  const revenue = MONTHS.map((_, mi) => {
    const s = seasonality[mi];
    return {
      month: MONTHS[mi],
      Haematology: Math.round(s * (9000 + Math.random()*3000)),
      Biochemistry: Math.round(s * (11000 + Math.random()*4000)),
      Microbiology: Math.round(s * (7000 + Math.random()*2500)),
      Pathology: Math.round(s * (6000 + Math.random()*2000)),
      Immunology: Math.round(s * (5000 + Math.random()*2000)),
      Radiology: Math.round(s * (13000 + Math.random()*5000)),
      Other: Math.round(s * (2500 + Math.random()*1500)),
    };
  });

  const expenses = MONTHS.map((_, mi) => {
    const rev = Object.values(revenue[mi]).slice(1).reduce((a,b)=>a+b,0);
    const ratio = 0.65 + Math.random()*0.12;
    const total = rev * ratio;
    return {
      month: MONTHS[mi],
      "Reagents & Supplies": Math.round(total * 0.22),
      "Equipment Maintenance": Math.round(total * 0.10),
      "Staff Salaries": Math.round(total * 0.38),
      "Utilities": Math.round(total * 0.06),
      "Lab Consumables": Math.round(total * 0.09),
      "Quality Control": Math.round(total * 0.05),
      "Admin & Overhead": Math.round(total * 0.07),
      Other: Math.round(total * 0.03),
    };
  });

  const testVolume = MONTHS.map((_, mi) => {
    const s = seasonality[mi];
    return {
      month: MONTHS[mi],
      Haematology: Math.round(s * (280 + Math.random()*80)),
      Biochemistry: Math.round(s * (340 + Math.random()*100)),
      Microbiology: Math.round(s * (200 + Math.random()*70)),
      Pathology: Math.round(s * (150 + Math.random()*60)),
      Immunology: Math.round(s * (140 + Math.random()*50)),
      Radiology: Math.round(s * (320 + Math.random()*90)),
      Other: Math.round(s * (80 + Math.random()*40)),
    };
  });

  const budgets = MONTHS.map((_, mi) => {
    const exp = Object.values(expenses[mi]).slice(1).reduce((a,b)=>a+b,0);
    return { month: MONTHS[mi], budget: Math.round(exp * 1.05) };
  });

  const vendors = ["MedSupply Co","LabTech Inc","BioChem Ltd","PharmaCorp","InstraCare","DiagPlus","SciEquip","MedWaste Mgmt","ImmunoDx","RadioPharma"];
  const statuses = ["Paid","Paid","Paid","Pending","Paid","Overdue","Paid","Pending","Disputed","Paid","Paid","Paid","Overdue","Pending","Paid"];
  const expenseLogs = Array.from({length:30}, (_,i) => {
    const mi = Math.floor(i / 2.5);
    const cat = EXPENSE_CATS[i % EXPENSE_CATS.length];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const qty = Math.floor(Math.random()*10)+1;
    const unitCost = Math.round((50 + Math.random()*450)*100)/100;
    return {
      id: i+1,
      date: `2025-${String((mi%12)+1).padStart(2,"0")}-${String(Math.floor(Math.random()*28)+1).padStart(2,"0")}`,
      vendor: vendors[i % vendors.length],
      department: dept,
      category: cat,
      description: `${cat} for ${dept}`,
      qty,
      unitCost,
      total: Math.round(qty * unitCost * 100) / 100,
      invoiceNo: `INV-${2025000+i+1}`,
      status: statuses[i % statuses.length],
      approvedBy: ["Dr. Smith","Dr. Okonkwo","Ms. Tabe","Mr. Fon","Dr. Abah"][i%5],
      notes: "",
    };
  });

  return { revenue, expenses, testVolume, budgets, expenseLogs };
}

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
};
const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return "—";
  return n.toFixed(1) + "%";
};
const fmtNum = (n) => {
  if (!n && n !== 0) return "—";
  return Math.round(n).toLocaleString("en-US");
};

// ─────────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────────
const initData = generateSampleData();

function dataReducer(state, action) {
  switch(action.type) {
    case "UPDATE_REVENUE": {
      const rev = state.revenue.map((r,i) => i===action.monthIdx ? {...r, [action.dept]: Number(action.value)||0} : r);
      return {...state, revenue: rev};
    }
    case "UPDATE_EXPENSE": {
      const exp = state.expenses.map((r,i) => i===action.monthIdx ? {...r, [action.cat]: Number(action.value)||0} : r);
      return {...state, expenses: exp};
    }
    case "UPDATE_VOLUME": {
      const vol = state.testVolume.map((r,i) => i===action.monthIdx ? {...r, [action.dept]: Number(action.value)||0} : r);
      return {...state, testVolume: vol};
    }
    case "UPDATE_BUDGET": {
      const bud = state.budgets.map((r,i) => i===action.monthIdx ? {...r, budget: Number(action.value)||0} : r);
      return {...state, budgets: bud};
    }
    case "ADD_LOG": return {...state, expenseLogs: [...state.expenseLogs, {...action.entry, id: Date.now()}]};
    case "EDIT_LOG": return {...state, expenseLogs: state.expenseLogs.map(l => l.id===action.entry.id ? action.entry : l)};
    case "DELETE_LOG": return {...state, expenseLogs: state.expenseLogs.filter(l => l.id!==action.id)};
    case "RESET": return generateSampleData();
    case "CLEAR": {
      const blankRevenue = MONTHS.map(m => DEPARTMENTS.reduce((o,d)=>({...o,[d]:0}),{month:m}));
      const blankExpenses = MONTHS.map(m => EXPENSE_CATS.reduce((o,c)=>({...o,[c]:0}),{month:m}));
      const blankVolume = MONTHS.map(m => DEPARTMENTS.reduce((o,d)=>({...o,[d]:0}),{month:m}));
      const blankBudgets = MONTHS.map(m => ({month:m, budget:0}));
      return { revenue:blankRevenue, expenses:blankExpenses, testVolume:blankVolume, budgets:blankBudgets, expenseLogs:[] };
    }
    default: return state;
  }
}

// ─────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────
function StatusBadge({ margin }) {
  if (margin >= 20) return <span style={{background:"#D5F5E3",color:"#1E8449",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:500}}>✅ Healthy</span>;
  if (margin >= 5)  return <span style={{background:"#FEF9E7",color:"#9A7D0A",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:500}}>⚠️ Watch</span>;
  return <span style={{background:"#FADBD8",color:"#922B21",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:500}}>🔴 Loss</span>;
}

function KPICard({ label, value, accent, trend, isPercent }) {
  const trendVal = trend !== null && trend !== undefined ? trend : null;
  return (
    <div style={{background:COLORS.card,borderRadius:8,padding:"20px 24px",borderTop:`4px solid ${accent}`,flex:1,minWidth:0}}>
      <div style={{fontSize:28,fontWeight:700,color:accent,letterSpacing:-1}}>{value}</div>
      <div style={{fontSize:13,color:COLORS.textSecondary,marginTop:4,fontWeight:500}}>{label}</div>
      {trendVal !== null && (
        <div style={{marginTop:6,fontSize:12,color: trendVal>=0?"#17A589":"#C0392B",display:"flex",alignItems:"center",gap:4}}>
          {trendVal>=0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
          {Math.abs(trendVal).toFixed(1)}% vs prior period
        </div>
      )}
    </div>
  );
}

function InlineEdit({ value, onSave, style={} }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (editing) return (
    <input
      autoFocus
      value={val}
      onChange={e=>setVal(e.target.value)}
      onBlur={()=>{setEditing(false);onSave(val);}}
      onKeyDown={e=>{if(e.key==="Enter"){setEditing(false);onSave(val);}}}
      style={{width:"100%",border:"1px solid #2E5FA3",borderRadius:4,padding:"2px 6px",fontSize:13,textAlign:"right",...style}}
    />
  );
  return (
    <span onClick={()=>{setVal(value);setEditing(true);}} style={{cursor:"pointer",display:"block",textAlign:"right",padding:"2px 4px",borderRadius:4,...style}}
      title="Click to edit">
      {typeof value==="number"? value.toLocaleString("en-US") : value}
    </span>
  );
}

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency=true }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:COLORS.navy,color:"#fff",borderRadius:6,padding:"10px 14px",fontSize:12}}>
      <div style={{fontWeight:600,marginBottom:6}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color||"#fff",display:"flex",justifyContent:"space-between",gap:16}}>
          <span>{p.name}</span>
          <span style={{fontWeight:600}}>{currency ? fmt(p.value) : fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 1 — DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ data }) {
  const monthlyCalc = useMemo(() => data.revenue.map((r,i) => {
    const rev = DEPARTMENTS.reduce((a,d)=>a+(r[d]||0),0);
    const exp = EXPENSE_CATS.reduce((a,c)=>a+(data.expenses[i][c]||0),0);
    const tests = DEPARTMENTS.reduce((a,d)=>a+(data.testVolume[i][d]||0),0);
    const profit = rev - exp;
    const margin = rev>0 ? (profit/rev)*100 : 0;
    return { month:r.month, revenue:rev, expenses:exp, profit, margin, tests, costPerTest: tests>0 ? exp/tests : 0 };
  }), [data]);

  const totRevenue = monthlyCalc.reduce((a,m)=>a+m.revenue,0);
  const totExpenses = monthlyCalc.reduce((a,m)=>a+m.expenses,0);
  const totProfit = totRevenue - totExpenses;
  const totMargin = totRevenue>0 ? (totProfit/totRevenue)*100 : 0;

  const prevHalf = monthlyCalc.slice(0,6).reduce((a,m)=>a+m.revenue,0);
  const currHalf = monthlyCalc.slice(6).reduce((a,m)=>a+m.revenue,0);
  const revTrend = prevHalf>0 ? ((currHalf-prevHalf)/prevHalf)*100 : 0;

  const profitColor = totProfit >= 0 ? COLORS.teal : COLORS.red;
  const marginColor = totMargin >= 20 ? COLORS.teal : totMargin >= 5 ? COLORS.gold : COLORS.red;

  const barData = monthlyCalc.map(m => ({...m, profitColor: m.profit>=0?"#17A589":"#C0392B"}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* KPI Row */}
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        <KPICard label="Total Revenue" value={fmt(totRevenue)} accent={COLORS.teal} trend={revTrend}/>
        <KPICard label="Total Expenses" value={fmt(totExpenses)} accent={COLORS.red} trend={null}/>
        <KPICard label="Gross Profit" value={fmt(totProfit)} accent={profitColor} trend={null}/>
        <KPICard label="Profit Margin" value={fmtPct(totMargin)} accent={marginColor} trend={null}/>
      </div>

      {/* Charts Row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Monthly Revenue vs Expenses</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyCalc} margin={{top:4,right:16,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0"/>
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"} tick={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend/>
              <Line type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={2} dot={false} name="Revenue"/>
              <Line type="monotone" dataKey="expenses" stroke={COLORS.red} strokeWidth={2} dot={false} name="Expenses"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Monthly Gross Profit</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{top:4,right:16,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"} tick={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <ReferenceLine y={0} stroke={COLORS.navy} strokeWidth={1.5}/>
              <Bar dataKey="profit" name="Gross Profit">
                {barData.map((entry,i)=><Cell key={i} fill={entry.profit>=0?"#17A589":"#C0392B"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div style={{background:COLORS.card,borderRadius:8,overflow:"hidden"}}>
        <div style={{fontWeight:600,color:COLORS.textPrimary,padding:"16px 20px",fontSize:14,borderBottom:"1px solid #E8ECF0"}}>Monthly Summary</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#F2F4F6"}}>
                {["Month","Revenue","Expenses","Gross Profit","Margin","Tests","Cost/Test","Status"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",fontWeight:600,color:COLORS.textSecondary,fontSize:12,whiteSpace:"nowrap",textAlign:h==="Month"||h==="Status"?"left":"right"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyCalc.map((m,i)=>{
                const isRecent = i >= 9;
                return (
                  <tr key={m.month} style={{background: isRecent?"#F8FBFF":i%2===0?"#fff":"#FAFBFC",borderLeft:isRecent?"3px solid #2E5FA3":"3px solid transparent"}}>
                    <td style={{padding:"9px 14px",fontWeight:500,color:COLORS.textPrimary}}>{m.month}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",color:COLORS.teal,fontWeight:500}}>{fmt(m.revenue)}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",color:COLORS.red}}>{fmt(m.expenses)}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",color:m.profit>=0?COLORS.teal:COLORS.red,fontWeight:500}}>{fmt(m.profit)}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",color:m.margin>=20?COLORS.teal:m.margin>=5?COLORS.gold:COLORS.red}}>{fmtPct(m.margin)}</td>
                    <td style={{padding:"9px 14px",textAlign:"right"}}>{fmtNum(m.tests)}</td>
                    <td style={{padding:"9px 14px",textAlign:"right"}}>{fmt(m.costPerTest)}</td>
                    <td style={{padding:"9px 14px"}}><StatusBadge margin={m.margin}/></td>
                  </tr>
                );
              })}
              <tr style={{background:COLORS.navy,color:"#fff",fontWeight:600}}>
                <td style={{padding:"10px 14px"}}>TOTAL</td>
                <td style={{padding:"10px 14px",textAlign:"right"}}>{fmt(totRevenue)}</td>
                <td style={{padding:"10px 14px",textAlign:"right"}}>{fmt(totExpenses)}</td>
                <td style={{padding:"10px 14px",textAlign:"right"}}>{fmt(totProfit)}</td>
                <td style={{padding:"10px 14px",textAlign:"right"}}>{fmtPct(totMargin)}</td>
                <td style={{padding:"10px 14px",textAlign:"right"}}>{fmtNum(monthlyCalc.reduce((a,m)=>a+m.tests,0))}</td>
                <td style={{padding:"10px 14px",textAlign:"right"}}>{fmt(totExpenses/monthlyCalc.reduce((a,m)=>a+m.tests,0))}</td>
                <td style={{padding:"10px 14px"}}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 2 — REVENUE
// ─────────────────────────────────────────────
function Revenue({ data, dispatch }) {
  const monthlyTotals = data.revenue.map(r => ({...r, total: DEPARTMENTS.reduce((a,d)=>a+(r[d]||0),0)}));
  const annualByDept = DEPARTMENTS.map((d,i) => ({name:d, value: data.revenue.reduce((a,r)=>a+(r[d]||0),0), color:DEPT_COLORS[i]}));
  const avgByDept = {};
  DEPARTMENTS.forEach(d => { avgByDept[d] = data.revenue.reduce((a,r)=>a+(r[d]||0),0)/12; });

  const exportCSV = () => {
    const header = ["Month",...DEPARTMENTS,"Total"].join(",");
    const rows = monthlyTotals.map(r=>[r.month,...DEPARTMENTS.map(d=>r[d]),r.total].join(","));
    const csv = [header,...rows].join("\n");
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download="revenue.csv"; a.click();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:600,color:COLORS.textPrimary,fontSize:18}}>Revenue Analysis</div>
        <button onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:6,background:COLORS.teal,color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:500}}>
          <Download size={14}/> Export CSV
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Revenue by Department (Monthly)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTotals} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"} tick={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              {DEPARTMENTS.map((d,i)=><Bar key={d} dataKey={d} stackId="a" fill={DEPT_COLORS[i]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:COLORS.card,borderRadius:8,padding:20,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14,alignSelf:"flex-start"}}>Annual Revenue Share by Department</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={annualByDept} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" label={({name,percent})=>`${name.slice(0,5)} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {annualByDept.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={(v)=>fmt(v)}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",justifyContent:"center",marginTop:4}}>
            {annualByDept.map((d,i)=>(
              <span key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:COLORS.textSecondary}}>
                <span style={{width:10,height:10,borderRadius:2,background:d.color,display:"inline-block"}}/>
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{background:COLORS.card,borderRadius:8,overflow:"hidden"}}>
        <div style={{fontWeight:600,color:COLORS.textPrimary,padding:"14px 20px",fontSize:14,borderBottom:"1px solid #E8ECF0"}}>Revenue Data (Click any cell to edit)</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#F2F4F6"}}>
                <th style={{padding:"9px 12px",textAlign:"left",fontWeight:600,color:COLORS.textSecondary,whiteSpace:"nowrap"}}>Month</th>
                {DEPARTMENTS.map((d,i)=><th key={d} style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary,whiteSpace:"nowrap"}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:DEPT_COLORS[i],display:"inline-block"}}/>
                    {d}
                  </span>
                </th>)}
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary}}>Total</th>
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary}}>MoM Δ</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((row,mi)=>{
                const prevTotal = mi>0 ? monthlyTotals[mi-1].total : null;
                const momChg = prevTotal ? ((row.total-prevTotal)/prevTotal)*100 : null;
                return (
                  <tr key={row.month} style={{background:mi%2===0?"#fff":"#FAFBFC",borderBottom:"1px solid #F0F2F5"}}>
                    <td style={{padding:"7px 12px",fontWeight:500,color:COLORS.textPrimary}}>{row.month}</td>
                    {DEPARTMENTS.map(d=>{
                      const avg = avgByDept[d];
                      const v = row[d]||0;
                      const bg = v > avg*1.05 ? "#E8F8F5" : v < avg*0.95 ? "#FDEDEC" : "transparent";
                      return (
                        <td key={d} style={{padding:"2px 6px",textAlign:"right",background:bg}}>
                          <InlineEdit value={v} onSave={val=>dispatch({type:"UPDATE_REVENUE",monthIdx:mi,dept:d,value:val})}/>
                        </td>
                      );
                    })}
                    <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:COLORS.teal}}>{fmt(row.total)}</td>
                    <td style={{padding:"7px 12px",textAlign:"right",color:momChg===null?"inherit":momChg>=0?COLORS.teal:COLORS.red}}>
                      {momChg===null?"—":fmtPct(momChg)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{background:COLORS.navy,color:"#fff",fontWeight:600}}>
                <td style={{padding:"10px 12px"}}>TOTAL</td>
                {DEPARTMENTS.map(d=><td key={d} style={{padding:"10px 12px",textAlign:"right"}}>{fmt(annualByDept.find(a=>a.name===d)?.value)}</td>)}
                <td style={{padding:"10px 12px",textAlign:"right"}}>{fmt(monthlyTotals.reduce((a,r)=>a+r.total,0))}</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 3 — EXPENSES
// ─────────────────────────────────────────────
const EXP_COLORS = ["#2E5FA3","#C0392B","#8E44AD","#D4AC0D","#17A589","#E67E22","#1ABC9C","#95A5A6"];

function Expenses({ data, dispatch }) {
  const monthlyTotals = data.expenses.map((e,i)=>({...e, total: EXPENSE_CATS.reduce((a,c)=>a+(e[c]||0),0), budget: data.budgets[i].budget}));
  const annualByCat = EXPENSE_CATS.map((c,i)=>({name:c, value: data.expenses.reduce((a,e)=>a+(e[c]||0),0), color:EXP_COLORS[i]}));
  const annualTotal = annualByCat.reduce((a,x)=>a+x.value,0);
  const avgByCat = {};
  EXPENSE_CATS.forEach(c=>{ avgByCat[c] = data.expenses.reduce((a,e)=>a+(e[c]||0),0)/12; });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{fontWeight:600,color:COLORS.textPrimary,fontSize:18}}>Expense Analysis</div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Expenses by Category (Monthly)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTotals} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"} tick={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip/>}/>
              {EXPENSE_CATS.map((c,i)=><Bar key={c} dataKey={c} stackId="a" fill={EXP_COLORS[i]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Annual Expense Breakdown</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...annualByCat].sort((a,b)=>b.value-a.value).map(d=>({...d,pct:(d.value/annualTotal*100).toFixed(1)}))} layout="vertical" margin={{top:4,right:60,left:0,bottom:0}}>
              <XAxis type="number" tickFormatter={v=>"$"+Math.round(v/1000)+"k"} tick={{fontSize:11}}/>
              <YAxis dataKey="name" type="category" width={130} tick={{fontSize:11}}/>
              <Tooltip formatter={(v)=>fmt(v)}/>
              <Bar dataKey="value" label={{position:"right",formatter:(v,e)=>`${(v/annualTotal*100).toFixed(0)}%`,fontSize:11}}>
                {[...annualByCat].sort((a,b)=>b.value-a.value).map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:COLORS.card,borderRadius:8,overflow:"hidden"}}>
        <div style={{fontWeight:600,color:COLORS.textPrimary,padding:"14px 20px",fontSize:14,borderBottom:"1px solid #E8ECF0"}}>Expense Data (Click to edit · Gold = Budget)</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#F2F4F6"}}>
                <th style={{padding:"9px 12px",textAlign:"left",fontWeight:600,color:COLORS.textSecondary}}>Month</th>
                {EXPENSE_CATS.map(c=><th key={c} style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary,whiteSpace:"nowrap",fontSize:11}}>{c.split(" ")[0]}</th>)}
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary}}>Total</th>
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:"#9A7D0A",background:"#FDFAE6"}}>Budget</th>
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary}}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((row,mi)=>{
                const variance = row.budget - row.total;
                const pctUsed = row.budget > 0 ? (row.total/row.budget)*100 : 0;
                return (
                  <tr key={row.month} style={{background:mi%2===0?"#fff":"#FAFBFC",borderBottom:"1px solid #F0F2F5"}}>
                    <td style={{padding:"7px 12px",fontWeight:500,color:COLORS.textPrimary}}>{row.month}</td>
                    {EXPENSE_CATS.map(c=>{
                      const avg = avgByCat[c];
                      const v = row[c]||0;
                      const bg = v > avg*1.05 ? "#FDEDEC" : v < avg*0.95 ? "#E8F8F5" : "transparent";
                      return (
                        <td key={c} style={{padding:"2px 6px",background:bg}}>
                          <InlineEdit value={v} onSave={val=>dispatch({type:"UPDATE_EXPENSE",monthIdx:mi,cat:c,value:val})}/>
                        </td>
                      );
                    })}
                    <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:COLORS.red}}>
                      {fmt(row.total)}
                      <div style={{marginTop:3,height:4,borderRadius:2,background:"#E8ECF0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(100,pctUsed)}%`,background:pctUsed>100?COLORS.red:COLORS.teal,borderRadius:2,transition:"width 0.3s"}}/>
                      </div>
                    </td>
                    <td style={{padding:"3px 6px",background:"#FDFAE6"}}>
                      <InlineEdit value={row.budget} onSave={val=>dispatch({type:"UPDATE_BUDGET",monthIdx:mi,value:val})} style={{color:"#9A7D0A"}}/>
                    </td>
                    <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:variance>=0?COLORS.teal:COLORS.red}}>
                      {variance>=0?"+":""}{fmt(variance)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{background:COLORS.navy,color:"#fff",fontWeight:600}}>
                <td style={{padding:"10px 12px"}}>TOTAL</td>
                {EXPENSE_CATS.map(c=><td key={c} style={{padding:"10px 12px",textAlign:"right"}}>{fmt(annualByCat.find(a=>a.name===c)?.value)}</td>)}
                <td style={{padding:"10px 12px",textAlign:"right"}}>{fmt(annualTotal)}</td>
                <td style={{padding:"10px 12px",textAlign:"right"}}>{fmt(data.budgets.reduce((a,b)=>a+b.budget,0))}</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 4 — TEST VOLUME
// ─────────────────────────────────────────────
function TestVolume({ data, dispatch }) {
  const monthlyTotals = data.testVolume.map(r=>({...r, total: DEPARTMENTS.reduce((a,d)=>a+(r[d]||0),0)}));
  const annualTests = monthlyTotals.reduce((a,m)=>a+m.total,0);
  const annualExpenses = data.expenses.reduce((a,e)=>a+EXPENSE_CATS.reduce((b,c)=>b+(e[c]||0),0),0);
  const peakMonth = monthlyTotals.reduce((a,b)=>b.total>a.total?b:a);
  const avgDaily = annualTests / 365;
  const costPerTest = annualTests>0 ? annualExpenses/annualTests : 0;

  const radarData = MONTHS.map((m,i)=>{
    const obj = {month:m};
    DEPARTMENTS.forEach(d=>{ obj[d] = monthlyTotals[i][d]||0; });
    return obj;
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{fontWeight:600,color:COLORS.textPrimary,fontSize:18}}>Test Volume Analysis</div>

      {/* Stat Cards */}
      <div style={{display:"flex",gap:16}}>
        {[
          {label:"Peak Month", value: peakMonth.month+" ("+fmtNum(peakMonth.total)+")", color:COLORS.blue},
          {label:"Avg Daily Tests", value: fmtNum(Math.round(avgDaily)), color:COLORS.teal},
          {label:"Cost per Test", value: fmt(costPerTest), color:COLORS.gold},
        ].map(c=>(
          <div key={c.label} style={{flex:1,background:COLORS.card,borderRadius:8,padding:"18px 20px",borderLeft:`4px solid ${c.color}`}}>
            <div style={{fontSize:22,fontWeight:700,color:c.color}}>{c.value}</div>
            <div style={{fontSize:13,color:COLORS.textSecondary,marginTop:4}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Monthly Test Volume</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTotals} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tickFormatter={v=>fmtNum(v)} tick={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip currency={false}/>}/>
              <Area type="monotone" dataKey="total" stroke={COLORS.teal} fill="#D5F5E3" name="Total Tests"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:12,fontSize:14}}>Department Volume Comparison</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData.slice(0,6)} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid/>
              <PolarAngleAxis dataKey="month" tick={{fontSize:11}}/>
              <PolarRadiusAxis tick={{fontSize:9}}/>
              {DEPARTMENTS.map((d,i)=><Radar key={d} name={d} dataKey={d} stroke={DEPT_COLORS[i]} fill={DEPT_COLORS[i]} fillOpacity={0.15}/>)}
              <Legend wrapperStyle={{fontSize:10}}/>
              <Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:COLORS.card,borderRadius:8,overflow:"hidden"}}>
        <div style={{fontWeight:600,color:COLORS.textPrimary,padding:"14px 20px",fontSize:14,borderBottom:"1px solid #E8ECF0"}}>Test Volume Data (Click any cell to edit)</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#F2F4F6"}}>
                <th style={{padding:"9px 12px",textAlign:"left",fontWeight:600,color:COLORS.textSecondary}}>Month</th>
                {DEPARTMENTS.map(d=><th key={d} style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary,whiteSpace:"nowrap"}}>{d}</th>)}
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary}}>Total</th>
                <th style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:COLORS.textSecondary}}>Avg Daily</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((row,mi)=>(
                <tr key={row.month} style={{background:mi%2===0?"#fff":"#FAFBFC",borderBottom:"1px solid #F0F2F5"}}>
                  <td style={{padding:"7px 12px",fontWeight:500,color:COLORS.textPrimary}}>{row.month}</td>
                  {DEPARTMENTS.map(d=>(
                    <td key={d} style={{padding:"2px 6px"}}>
                      <InlineEdit value={row[d]||0} onSave={val=>dispatch({type:"UPDATE_VOLUME",monthIdx:mi,dept:d,value:val})}/>
                    </td>
                  ))}
                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:COLORS.blue}}>{fmtNum(row.total)}</td>
                  <td style={{padding:"7px 12px",textAlign:"right",color:COLORS.textSecondary}}>{fmtNum(Math.round(row.total/30))}</td>
                </tr>
              ))}
              <tr style={{background:COLORS.navy,color:"#fff",fontWeight:600}}>
                <td style={{padding:"10px 12px"}}>TOTAL</td>
                {DEPARTMENTS.map(d=><td key={d} style={{padding:"10px 12px",textAlign:"right"}}>{fmtNum(data.testVolume.reduce((a,r)=>a+(r[d]||0),0))}</td>)}
                <td style={{padding:"10px 12px",textAlign:"right"}}>{fmtNum(annualTests)}</td>
                <td style={{padding:"10px 12px",textAlign:"right"}}>{fmtNum(Math.round(avgDaily))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 5 — EXPENSE LOG
// ─────────────────────────────────────────────
const EMPTY_ENTRY = {
  id: null, date:"", vendor:"", department:DEPARTMENTS[0], category:EXPENSE_CATS[0],
  description:"", qty:1, unitCost:0, total:0, invoiceNo:"", status:"Pending",
  approvedBy:"", notes:""
};

function ExpenseLog({ data, dispatch }) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(EMPTY_ENTRY);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    let rows = data.expenseLogs;
    if (search) rows = rows.filter(r=>
      r.vendor?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterDept!=="All") rows = rows.filter(r=>r.department===filterDept);
    if (filterCat!=="All") rows = rows.filter(r=>r.category===filterCat);
    if (filterStatus!=="All") rows = rows.filter(r=>r.status===filterStatus);
    if (filterMonth!=="All") rows = rows.filter(r=>r.date?.slice(5,7)===String(MONTHS.indexOf(filterMonth)+1).padStart(2,"0"));
    rows = [...rows].sort((a,b)=>{
      const va=a[sortKey]||"", vb=b[sortKey]||"";
      if (sortDir==="asc") return va>vb?1:-1;
      return va<vb?1:-1;
    });
    return rows;
  }, [data.expenseLogs, search, filterDept, filterCat, filterStatus, filterMonth, sortKey, sortDir]);

  const totalLogged = data.expenseLogs.reduce((a,r)=>a+r.total,0);
  const totalPaid = data.expenseLogs.filter(r=>r.status==="Paid").reduce((a,r)=>a+r.total,0);
  const totalPending = data.expenseLogs.filter(r=>r.status==="Pending").reduce((a,r)=>a+r.total,0);
  const totalOverdue = data.expenseLogs.filter(r=>r.status==="Overdue").reduce((a,r)=>a+r.total,0);

  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));

  const handleSort = key => {
    if (sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const openAdd = () => { setEditEntry({...EMPTY_ENTRY}); setPanelOpen(true); };
  const openEdit = (entry) => { setEditEntry({...entry}); setPanelOpen(true); };
  const saveEntry = () => {
    const total = (editEntry.qty||0) * (editEntry.unitCost||0);
    const e = {...editEntry, total};
    if (e.id) dispatch({type:"EDIT_LOG",entry:e});
    else dispatch({type:"ADD_LOG",entry:{...e,id:Date.now()}});
    setPanelOpen(false);
  };

  const statusColor = s => ({
    "Paid":{bg:"#D5F5E3",text:"#1E8449"},
    "Pending":{bg:"#FEF9E7",text:"#9A7D0A"},
    "Overdue":{bg:"#FADBD8",text:"#922B21"},
    "Disputed":{bg:"#F4F6F7",text:"#5D6D7E"},
  }[s]||{bg:"#F4F6F7",text:"#5D6D7E"});

  const exportCSV = () => {
    const h = "Date,Vendor,Dept,Category,Description,Qty,Unit Cost,Total,Invoice,Status,Approved By";
    const rows = data.expenseLogs.map(r=>[r.date,r.vendor,r.department,r.category,r.description,r.qty,r.unitCost,r.total,r.invoiceNo,r.status,r.approvedBy].join(","));
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent([h,...rows].join("\n"));
    a.download="expense_log.csv"; a.click();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,position:"relative"}}>
      {/* Summary cards */}
      <div style={{display:"flex",gap:12}}>
        {[
          {label:"Total Logged",value:fmt(totalLogged),color:COLORS.blue},
          {label:"Paid",value:fmt(totalPaid),color:COLORS.teal},
          {label:"Pending",value:fmt(totalPending),color:COLORS.gold},
          {label:"Overdue",value:fmt(totalOverdue),color:COLORS.red},
        ].map(c=>(
          <div key={c.label} style={{flex:1,background:COLORS.card,borderRadius:8,padding:"12px 16px",borderLeft:`3px solid ${c.color}`}}>
            <div style={{fontSize:18,fontWeight:700,color:c.color}}>{c.value}</div>
            <div style={{fontSize:12,color:COLORS.textSecondary}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"1px solid #D8DCE6",borderRadius:6,padding:"6px 10px",flex:1,minWidth:160}}>
          <Search size={14} color={COLORS.textSecondary}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor, description..." style={{border:"none",outline:"none",fontSize:13,width:"100%",color:COLORS.textPrimary}}/>
        </div>
        {[
          {val:filterDept,set:setFilterDept,opts:["All",...DEPARTMENTS]},
          {val:filterCat,set:setFilterCat,opts:["All",...EXPENSE_CATS]},
          {val:filterStatus,set:setFilterStatus,opts:["All","Paid","Pending","Overdue","Disputed"]},
          {val:filterMonth,set:setFilterMonth,opts:["All",...MONTHS]},
        ].map((f,i)=>(
          <select key={i} value={f.val} onChange={e=>f.set(e.target.value)} style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"7px 10px",fontSize:13,color:COLORS.textPrimary,background:"#fff",cursor:"pointer"}}>
            {f.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={openAdd} style={{background:COLORS.blue,color:"#fff",border:"none",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:5}}>
          <Plus size={14}/> Add Transaction
        </button>
        <button onClick={exportCSV} style={{background:"#fff",color:COLORS.blue,border:"1px solid "+COLORS.blue,borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:5}}>
          <Download size={14}/> Export
        </button>
      </div>

      {/* Table */}
      <div style={{background:COLORS.card,borderRadius:8,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#F2F4F6",borderBottom:"2px solid #E0E4EE"}}>
                {[["date","Date"],["vendor","Vendor"],["department","Dept"],["category","Category"],["description","Description"],["qty","Qty"],["unitCost","Unit Cost"],["total","Total"],["invoiceNo","Invoice"],["status","Status"],["approvedBy","Approved"]].map(([k,label])=>(
                  <th key={k} onClick={()=>handleSort(k)} style={{padding:"10px 10px",textAlign:"left",fontWeight:600,color:COLORS.textSecondary,cursor:"pointer",whiteSpace:"nowrap",userSelect:"none",fontSize:11}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
                      {label}
                      {sortKey===k ? (sortDir==="asc"?<ChevronUp size={11}/>:<ChevronDown size={11}/>) : <ArrowUpDown size={11} style={{opacity:0.3}}/>}
                    </span>
                  </th>
                ))}
                <th style={{padding:"10px 10px",fontWeight:600,color:COLORS.textSecondary,fontSize:11}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row,i)=>{
                const sc = statusColor(row.status);
                return (
                  <tr key={row.id} style={{background:i%2===0?"#fff":"#FAFBFC",borderBottom:"1px solid #F0F2F5"}}>
                    <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>{row.date}</td>
                    <td style={{padding:"8px 10px",fontWeight:500}}>{row.vendor}</td>
                    <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>{row.department}</td>
                    <td style={{padding:"8px 10px",whiteSpace:"nowrap",color:COLORS.textSecondary,fontSize:11}}>{row.category}</td>
                    <td style={{padding:"8px 10px",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.description}</td>
                    <td style={{padding:"8px 10px",textAlign:"right"}}>{row.qty}</td>
                    <td style={{padding:"8px 10px",textAlign:"right"}}>{fmt(row.unitCost)}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600}}>{fmt(row.total)}</td>
                    <td style={{padding:"8px 10px",color:COLORS.textSecondary,fontSize:11}}>{row.invoiceNo}</td>
                    <td style={{padding:"8px 10px"}}>
                      <span style={{background:sc.bg,color:sc.text,padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{row.status}</span>
                    </td>
                    <td style={{padding:"8px 10px",color:COLORS.textSecondary,fontSize:11}}>{row.approvedBy}</td>
                    <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                      {deleteConfirm===row.id ? (
                        <span style={{fontSize:11}}>
                          Delete?{" "}
                          <button onClick={()=>{dispatch({type:"DELETE_LOG",id:row.id});setDeleteConfirm(null);}} style={{color:COLORS.red,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:600}}>Yes</button>
                          {" / "}
                          <button onClick={()=>setDeleteConfirm(null)} style={{color:COLORS.textSecondary,background:"none",border:"none",cursor:"pointer",fontSize:11}}>No</button>
                        </span>
                      ) : (
                        <span style={{display:"flex",gap:6}}>
                          <button onClick={()=>openEdit(row)} style={{background:"none",border:"none",cursor:"pointer",color:COLORS.blue,padding:2}}><Edit2 size={13}/></button>
                          <button onClick={()=>setDeleteConfirm(row.id)} style={{background:"none",border:"none",cursor:"pointer",color:COLORS.red,padding:2}}><Trash2 size={13}/></button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paged.length===0 && (
                <tr><td colSpan={12} style={{padding:24,textAlign:"center",color:COLORS.textSecondary}}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderTop:"1px solid #E8ECF0",fontSize:12,color:COLORS.textSecondary}}>
          <span>{filtered.length} transactions</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{background:"none",border:"1px solid #D8DCE6",borderRadius:4,padding:"4px 8px",cursor:"pointer",opacity:page===1?0.4:1}}><ChevronLeft size={13}/></button>
            <span style={{fontWeight:500,color:COLORS.textPrimary}}>Page {page} of {totalPages}</span>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{background:"none",border:"1px solid #D8DCE6",borderRadius:4,padding:"4px 8px",cursor:"pointer",opacity:page===totalPages?0.4:1}}><ChevronRight size={13}/></button>
          </div>
        </div>
      </div>

      {/* Slide-in panel */}
      {panelOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(27,42,74,0.4)",zIndex:100,display:"flex",justifyContent:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)setPanelOpen(false);}}>
          <div style={{width:420,background:"#fff",height:"100%",overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid #E8ECF0",position:"sticky",top:0,background:"#fff",zIndex:1}}>
              <div style={{fontWeight:600,fontSize:16,color:COLORS.textPrimary}}>{editEntry.id?"Edit Transaction":"Add Transaction"}</div>
              <button onClick={()=>setPanelOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:COLORS.textSecondary}}><X size={18}/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:14}}>
              {[
                {label:"Date",key:"date",type:"date"},
                {label:"Vendor Name",key:"vendor",type:"text"},
                {label:"Invoice #",key:"invoiceNo",type:"text"},
                {label:"Description",key:"description",type:"text"},
                {label:"Approved By",key:"approvedBy",type:"text"},
                {label:"Notes",key:"notes",type:"text"},
              ].map(f=>(
                <label key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontSize:12,fontWeight:500,color:COLORS.textSecondary}}>{f.label}</span>
                  <input type={f.type} value={editEntry[f.key]||""} onChange={e=>setEditEntry(p=>({...p,[f.key]:e.target.value}))}
                    style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"8px 12px",fontSize:13,color:COLORS.textPrimary,outline:"none"}}/>
                </label>
              ))}
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:12,fontWeight:500,color:COLORS.textSecondary}}>Department</span>
                <select value={editEntry.department} onChange={e=>setEditEntry(p=>({...p,department:e.target.value}))} style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"8px 12px",fontSize:13,color:COLORS.textPrimary}}>
                  {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:12,fontWeight:500,color:COLORS.textSecondary}}>Category</span>
                <select value={editEntry.category} onChange={e=>setEditEntry(p=>({...p,category:e.target.value}))} style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"8px 12px",fontSize:13,color:COLORS.textPrimary}}>
                  {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:12,fontWeight:500,color:COLORS.textSecondary}}>Status</span>
                <select value={editEntry.status} onChange={e=>setEditEntry(p=>({...p,status:e.target.value}))} style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"8px 12px",fontSize:13,color:COLORS.textPrimary}}>
                  {["Paid","Pending","Overdue","Disputed"].map(s=><option key={s}>{s}</option>)}
                </select>
              </label>
              <div style={{display:"flex",gap:12}}>
                <label style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontSize:12,fontWeight:500,color:COLORS.textSecondary}}>Quantity</span>
                  <input type="number" value={editEntry.qty} onChange={e=>setEditEntry(p=>({...p,qty:Number(e.target.value)}))}
                    style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"8px 12px",fontSize:13,color:COLORS.textPrimary,outline:"none"}}/>
                </label>
                <label style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontSize:12,fontWeight:500,color:COLORS.textSecondary}}>Unit Cost ($)</span>
                  <input type="number" value={editEntry.unitCost} onChange={e=>setEditEntry(p=>({...p,unitCost:Number(e.target.value)}))}
                    style={{border:"1px solid #D8DCE6",borderRadius:6,padding:"8px 12px",fontSize:13,color:COLORS.textPrimary,outline:"none"}}/>
                </label>
              </div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginTop:-4}}>
                Total: <strong style={{color:COLORS.textPrimary}}>{fmt((editEntry.qty||0)*(editEntry.unitCost||0))}</strong>
              </div>
            </div>
            <div style={{padding:"16px 24px",display:"flex",gap:10,borderTop:"1px solid #E8ECF0",position:"sticky",bottom:0,background:"#fff"}}>
              <button onClick={saveEntry} style={{flex:1,background:COLORS.blue,color:"#fff",border:"none",borderRadius:6,padding:"10px",cursor:"pointer",fontSize:14,fontWeight:500}}>
                Save Transaction
              </button>
              <button onClick={()=>setPanelOpen(false)} style={{flex:1,background:"none",color:COLORS.textSecondary,border:"1px solid #D8DCE6",borderRadius:6,padding:"10px",cursor:"pointer",fontSize:14}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 6 — P&L SUMMARY
// ─────────────────────────────────────────────
function PLSummary({ data }) {
  const [view, setView] = useState("quarterly");

  const quarterlyRevenue = [0,1,2,3].map(q =>
    DEPARTMENTS.reduce((obj,d) => ({...obj,[d]: data.revenue.slice(q*3,(q+1)*3).reduce((a,r)=>a+(r[d]||0),0)}), {})
  );
  const quarterlyExpenses = [0,1,2,3].map(q =>
    EXPENSE_CATS.reduce((obj,c) => ({...obj,[c]: data.expenses.slice(q*3,(q+1)*3).reduce((a,e)=>a+(e[c]||0),0)}), {})
  );

  const qRevTotals = quarterlyRevenue.map(q => DEPARTMENTS.reduce((a,d)=>a+(q[d]||0),0));
  const qExpTotals = quarterlyExpenses.map(q => EXPENSE_CATS.reduce((a,c)=>a+(q[c]||0),0));
  const fullRevenue = DEPARTMENTS.reduce((obj,d) => ({...obj,[d]: data.revenue.reduce((a,r)=>a+(r[d]||0),0)}), {});
  const fullExpenses = EXPENSE_CATS.reduce((obj,c) => ({...obj,[c]: data.expenses.reduce((a,e)=>a+(e[c]||0),0)}), {});
  const fullRevTotal = DEPARTMENTS.reduce((a,d)=>a+(fullRevenue[d]||0),0);
  const fullExpTotal = EXPENSE_CATS.reduce((a,c)=>a+(fullExpenses[c]||0),0);
  const fullProfit = fullRevTotal - fullExpTotal;
  const fullMargin = fullRevTotal>0 ? (fullProfit/fullRevTotal)*100 : 0;

  const fmtPL = v => {
    if (v===null||v===undefined||isNaN(v)||!isFinite(v)) return "—";
    if (v<0) return <span style={{color:COLORS.red}}>({fmt(Math.abs(v))})</span>;
    return fmt(v);
  };

  const qCols = ["Q1","Q2","Q3","Q4"];
  const colStyle = {padding:"9px 14px",textAlign:"right",fontSize:13};
  const hdrStyle = {...colStyle,fontWeight:600,color:COLORS.textSecondary,fontSize:12};

  const waterfallData = useMemo(()=>{
    const fRev = DEPARTMENTS.reduce((obj,d) => ({...obj,[d]: data.revenue.reduce((a,r)=>a+(r[d]||0),0)}), {});
    const fExp = EXPENSE_CATS.reduce((obj,c) => ({...obj,[c]: data.expenses.reduce((a,e)=>a+(e[c]||0),0)}), {});
    const fRevTotal = DEPARTMENTS.reduce((a,d)=>a+(fRev[d]||0),0);
    let running = fRevTotal;
    const rows = [{name:"Revenue",value:fRevTotal,type:"revenue"}];
    EXPENSE_CATS.forEach(c=>{
      const v = fExp[c]||0;
      rows.push({name:c.split(" ")[0],value:-v,type:"expense"});
      running -= v;
    });
    rows.push({name:"Gross Profit",value:running,type:"profit"});
    return rows;
  }, [data]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:600,color:COLORS.textPrimary,fontSize:18}}>Profit & Loss Statement</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",border:"1px solid #D8DCE6",borderRadius:6,overflow:"hidden"}}>
            {["quarterly","annual"].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"7px 14px",fontSize:13,border:"none",cursor:"pointer",fontWeight:500,
                background:view===v?COLORS.blue:"#fff",color:view===v?"#fff":COLORS.textSecondary,textTransform:"capitalize"}}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={()=>window.print()} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",color:COLORS.textPrimary,border:"1px solid #D8DCE6",borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:13}}>
            <Printer size={14}/> Print / Export
          </button>
        </div>
      </div>

      <div style={{background:COLORS.card,borderRadius:8,overflow:"hidden",border:"1px solid #E8ECF0"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:"2px solid #E0E4EE"}}>
              <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:COLORS.textPrimary,width:"35%"}}>Description</th>
              {view==="quarterly" ? qCols.map(q=>(
                <th key={q} style={{...hdrStyle}}>{q}</th>
              )) : null}
              <th style={{...hdrStyle,color:COLORS.textPrimary}}>Full Year</th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue Section */}
            <tr style={{background:"#F2F4F6"}}>
              <td colSpan={view==="quarterly"?6:2} style={{padding:"8px 16px",fontWeight:700,fontSize:12,color:COLORS.textSecondary,letterSpacing:1}}>REVENUE</td>
            </tr>
            {DEPARTMENTS.map(d=>(
              <tr key={d} style={{borderBottom:"1px solid #F5F5F5"}}>
                <td style={{padding:"7px 16px 7px 28px",color:COLORS.textPrimary}}>{d}</td>
                {view==="quarterly" && qRevTotals.map((_,qi)=>(
                  <td key={qi} style={colStyle}>{fmtPL(quarterlyRevenue[qi][d])}</td>
                ))}
                <td style={{...colStyle,fontWeight:500}}>{fmtPL(fullRevenue[d])}</td>
              </tr>
            ))}
            <tr style={{background:"#E8F8F5",borderTop:"2px solid #17A589"}}>
              <td style={{padding:"10px 16px",fontWeight:700,color:COLORS.teal}}>Total Revenue</td>
              {view==="quarterly" && qRevTotals.map((v,qi)=>(
                <td key={qi} style={{...colStyle,fontWeight:700,color:COLORS.teal}}>{fmtPL(v)}</td>
              ))}
              <td style={{...colStyle,fontWeight:700,color:COLORS.teal}}>{fmtPL(fullRevTotal)}</td>
            </tr>

            {/* Expenses Section */}
            <tr style={{background:"#F2F4F6"}}>
              <td colSpan={view==="quarterly"?6:2} style={{padding:"8px 16px",fontWeight:700,fontSize:12,color:COLORS.textSecondary,letterSpacing:1}}>EXPENSES</td>
            </tr>
            {EXPENSE_CATS.map(c=>(
              <tr key={c} style={{borderBottom:"1px solid #F5F5F5"}}>
                <td style={{padding:"7px 16px 7px 28px",color:COLORS.textPrimary}}>{c}</td>
                {view==="quarterly" && [0,1,2,3].map(qi=>(
                  <td key={qi} style={colStyle}>{fmtPL(quarterlyExpenses[qi][c])}</td>
                ))}
                <td style={{...colStyle,fontWeight:500}}>{fmtPL(fullExpenses[c])}</td>
              </tr>
            ))}
            <tr style={{background:"#FADBD8",borderTop:"2px solid #C0392B"}}>
              <td style={{padding:"10px 16px",fontWeight:700,color:COLORS.red}}>Total Expenses</td>
              {view==="quarterly" && qExpTotals.map((v,qi)=>(
                <td key={qi} style={{...colStyle,fontWeight:700,color:COLORS.red}}>{fmtPL(v)}</td>
              ))}
              <td style={{...colStyle,fontWeight:700,color:COLORS.red}}>{fmtPL(fullExpTotal)}</td>
            </tr>

            {/* Separator */}
            <tr style={{height:4,background:"#F2F4F6"}}><td colSpan={view==="quarterly"?6:2}/></tr>

            {/* Gross Profit */}
            <tr style={{borderTop:"3px solid "+COLORS.navy}}>
              <td style={{padding:"12px 16px",fontWeight:700,fontSize:15,color:COLORS.textPrimary}}>GROSS PROFIT</td>
              {view==="quarterly" && [0,1,2,3].map(qi=>{
                const qp = qRevTotals[qi]-qExpTotals[qi];
                return <td key={qi} style={{...colStyle,fontWeight:700,fontSize:15,color:qp>=0?COLORS.teal:COLORS.red}}>{fmtPL(qp)}</td>;
              })}
              <td style={{...colStyle,fontWeight:700,fontSize:15,color:fullProfit>=0?COLORS.teal:COLORS.red}}>{fmtPL(fullProfit)}</td>
            </tr>
            <tr>
              <td style={{padding:"8px 16px",color:COLORS.textSecondary,fontSize:13}}>Net Profit Margin</td>
              {view==="quarterly" && [0,1,2,3].map(qi=>{
                const qm = qRevTotals[qi]>0?((qRevTotals[qi]-qExpTotals[qi])/qRevTotals[qi])*100:0;
                return <td key={qi} style={{...colStyle,color:qm>=20?COLORS.teal:qm>=5?COLORS.gold:COLORS.red}}>{fmtPct(qm)}</td>;
              })}
              <td style={{...colStyle,fontWeight:600,color:fullMargin>=20?COLORS.teal:fullMargin>=5?COLORS.gold:COLORS.red}}>{fmtPct(fullMargin)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {view==="annual" && (
        <div style={{background:COLORS.card,borderRadius:8,padding:20}}>
          <div style={{fontWeight:600,color:COLORS.textPrimary,marginBottom:16,fontSize:14}}>Waterfall: Revenue → Expenses → Gross Profit</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={waterfallData} margin={{top:4,right:16,left:0,bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:COLORS.textSecondary}} angle={-35} textAnchor="end" interval={0}/>
              <YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"} tick={{fontSize:11}}/>
              <Tooltip formatter={(v,_,p)=>[fmt(Math.abs(p.payload.value)), p.payload.type==="expense"?"Expense":"Amount"]} labelStyle={{fontWeight:600}}/>
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {waterfallData.map((e,i)=>(
                  <Cell key={i} fill={e.type==="revenue"?COLORS.teal:e.type==="profit"?(e.value>=0?COLORS.teal:COLORS.red):COLORS.red}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CREDENTIALS  (change these to your own)
// ─────────────────────────────────────────────
const USERS = [
  { username: "admin",    password: "LabAdmin@2025",  role: "Administrator" },
  { username: "labmgr",   password: "LabMgr@2025",    role: "Lab Manager"   },
  { username: "finance",  password: "Finance@2025",   role: "Finance Officer"},
];

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const attempt = () => {
    const user = USERS.find(u => u.username === username.trim() && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError("Incorrect username or password.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:COLORS.navy,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-8px)}
          40%,80%{transform:translateX(8px)}
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>

      <div className={shaking ? "shake" : ""} style={{
        background:"#fff", borderRadius:12, padding:"40px 44px", width:380,
        boxShadow:"0 20px 60px rgba(0,0,0,0.35)",
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28,justifyContent:"center"}}>
          <div style={{width:44,height:44,background:COLORS.navy,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Hospital size={22} color="#17A589"/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:COLORS.navy,lineHeight:1.2}}>Lab Financial Tracker</div>
            <div style={{fontSize:12,color:COLORS.textSecondary}}>Secure Access Portal</div>
          </div>
        </div>

        <div style={{borderTop:"1px solid #E8ECF0",paddingTop:24,display:"flex",flexDirection:"column",gap:16}}>
          <label style={{display:"flex",flexDirection:"column",gap:6}}>
            <span style={{fontSize:12,fontWeight:600,color:COLORS.textSecondary,letterSpacing:.4}}>USERNAME</span>
            <input
              value={username}
              onChange={e=>{setUsername(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&attempt()}
              placeholder="Enter username"
              autoFocus
              style={{
                border:"1px solid #D8DCE6",borderRadius:6,padding:"10px 12px",
                fontSize:14,color:COLORS.textPrimary,outline:"none",
                transition:"border 0.15s",
              }}
              onFocus={e=>e.target.style.borderColor=COLORS.blue}
              onBlur={e=>e.target.style.borderColor="#D8DCE6"}
            />
          </label>

          <label style={{display:"flex",flexDirection:"column",gap:6}}>
            <span style={{fontSize:12,fontWeight:600,color:COLORS.textSecondary,letterSpacing:.4}}>PASSWORD</span>
            <div style={{position:"relative"}}>
              <input
                type={showPw?"text":"password"}
                value={password}
                onChange={e=>{setPassword(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&attempt()}
                placeholder="Enter password"
                style={{
                  width:"100%",border:"1px solid #D8DCE6",borderRadius:6,
                  padding:"10px 40px 10px 12px",fontSize:14,color:COLORS.textPrimary,
                  outline:"none",boxSizing:"border-box",transition:"border 0.15s",
                }}
                onFocus={e=>e.target.style.borderColor=COLORS.blue}
                onBlur={e=>e.target.style.borderColor="#D8DCE6"}
              />
              <button
                onClick={()=>setShowPw(v=>!v)}
                style={{
                  position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",
                  color:COLORS.textSecondary,fontSize:12,padding:2,
                }}
              >{showPw?"Hide":"Show"}</button>
            </div>
          </label>

          {error && (
            <div style={{
              background:"#FADBD8",color:"#922B21",borderRadius:6,
              padding:"9px 12px",fontSize:13,fontWeight:500,
              border:"1px solid #F5B7B1",
            }}>⚠ {error}</div>
          )}

          <button
            onClick={attempt}
            style={{
              background:COLORS.blue,color:"#fff",border:"none",borderRadius:6,
              padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer",
              marginTop:4,letterSpacing:.3,
            }}
          >
            Sign In
          </button>
        </div>

        <div style={{marginTop:20,padding:"14px",background:"#F8FAFC",borderRadius:6,fontSize:11,color:COLORS.textSecondary,lineHeight:1.7}}>
          <div style={{fontWeight:600,marginBottom:4,color:COLORS.textPrimary}}>Demo credentials:</div>
          {USERS.map(u=>(
            <div key={u.username}>
              <span style={{fontFamily:"monospace",background:"#E8ECF0",padding:"1px 5px",borderRadius:3,color:COLORS.navy}}>{u.username}</span>
              {" / "}
              <span style={{fontFamily:"monospace",background:"#E8ECF0",padding:"1px 5px",borderRadius:3,color:COLORS.navy}}>{u.password}</span>
              {" — "}{u.role}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIRM MODAL (replaces window.confirm)
// ─────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, danger=true }) {
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(27,42,74,0.55)",
      zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <div style={{
        background:"#fff",borderRadius:10,padding:"28px 32px",width:380,
        boxShadow:"0 12px 40px rgba(0,0,0,0.2)",
      }}>
        <div style={{fontWeight:700,fontSize:16,color:COLORS.textPrimary,marginBottom:10}}>{title}</div>
        <div style={{fontSize:13,color:COLORS.textSecondary,lineHeight:1.6,marginBottom:24}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{
            background:"none",border:"1px solid #D8DCE6",borderRadius:6,
            padding:"8px 20px",cursor:"pointer",fontSize:13,color:COLORS.textSecondary,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background:danger?COLORS.red:COLORS.blue,color:"#fff",border:"none",
            borderRadius:6,padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:600,
          }}>Yes, clear everything</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [data, dispatch] = useReducer(dataReducer, initData);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(()=>{ const t = setTimeout(()=>setLoading(false),300); return ()=>clearTimeout(t); },[]);

  // Show login screen if not authenticated
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser}/>;

  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:LayoutDashboard},
    {id:"revenue",label:"Revenue",icon:TrendingUp},
    {id:"expenses",label:"Expenses",icon:TrendingDown},
    {id:"testvolume",label:"Test Volume",icon:FlaskConical},
    {id:"expenselog",label:"Expense Log",icon:Receipt},
    {id:"pnl",label:"P&L Summary",icon:FileText},
  ];

  const renderScreen = () => {
    if (loading) return (
      <div style={{display:"flex",flexDirection:"column",gap:16,padding:24}}>
        {[200,150,300].map((h,i)=>(
          <div key={i} style={{height:h,borderRadius:8,background:"linear-gradient(90deg,#E8ECF0 25%,#F2F4F6 50%,#E8ECF0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
    switch(activeTab) {
      case "dashboard": return <Dashboard data={data}/>;
      case "revenue": return <Revenue data={data} dispatch={dispatch}/>;
      case "expenses": return <Expenses data={data} dispatch={dispatch}/>;
      case "testvolume": return <TestVolume data={data} dispatch={dispatch}/>;
      case "expenselog": return <ExpenseLog data={data} dispatch={dispatch}/>;
      case "pnl": return <PLSummary data={data}/>;
      default: return null;
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US",{weekday:"short",year:"numeric",month:"short",day:"numeric"});

  return (
    <div style={{display:"flex",height:"100vh",background:COLORS.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:COLORS.textPrimary,overflow:"hidden"}}>

      {/* Confirm modal for Clear All Data */}
      {showClearConfirm && (
        <ConfirmModal
          title="Clear all data?"
          message="This will permanently zero out all revenue, expenses, test volumes, budgets, and transaction logs. This cannot be undone."
          onConfirm={()=>{ dispatch({type:"CLEAR"}); setShowClearConfirm(false); }}
          onCancel={()=>setShowClearConfirm(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{width:sidebarOpen?240:0,minWidth:sidebarOpen?240:0,background:COLORS.navy,transition:"all 0.2s",overflow:"hidden",display:"flex",flexDirection:"column",zIndex:10}}>
        <div style={{width:240,padding:"20px 0 8px",display:"flex",flexDirection:"column",height:"100%"}}>
          <div style={{padding:"0 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Hospital size={22} color="#17A589"/>
              <div>
                <div style={{color:"#fff",fontWeight:700,fontSize:14,lineHeight:1.2}}>Lab Financial</div>
                <div style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>Tracker</div>
              </div>
            </div>
          </div>
          <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:2}}>
            {tabs.map(tab=>{
              const Icon = tab.icon;
              const active = activeTab===tab.id;
              return (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,
                  background:active?"#2E5FA3":"transparent",color:active?"#fff":"rgba(255,255,255,0.6)",
                  border:"none",cursor:"pointer",textAlign:"left",fontSize:13,fontWeight:active?600:400,
                  transition:"background 0.15s,color 0.15s",width:"100%",
                }}>
                  <Icon size={17}/> {tab.label}
                </button>
              );
            })}
          </nav>
          <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={()=>dispatch({type:"RESET"})} style={{width:"100%",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:500}}>
              ↺ Load Demo Data
            </button>
            <button onClick={()=>setShowClearConfirm(true)} style={{width:"100%",background:"rgba(192,57,43,0.15)",color:"rgba(255,160,150,0.9)",border:"1px solid rgba(192,57,43,0.3)",borderRadius:6,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:500}}>
              🗑 Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        {/* Header */}
        <div style={{background:COLORS.card,borderBottom:"1px solid #E0E4EE",padding:"0 20px",height:56,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",color:COLORS.textSecondary,padding:4,display:"flex",alignItems:"center"}}>
            <Menu size={20}/>
          </button>
          <div style={{flex:1,fontWeight:600,color:COLORS.textPrimary,fontSize:15}}>
            {tabs.find(t=>t.id===activeTab)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6,color:COLORS.textSecondary,fontSize:12}}>
              <Calendar size={14}/>
              {dateStr}
            </div>
            {/* User badge + logout */}
            <div style={{display:"flex",alignItems:"center",gap:8,borderLeft:"1px solid #E0E4EE",paddingLeft:16}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:600,color:COLORS.textPrimary,lineHeight:1.2}}>{currentUser.username}</div>
                <div style={{fontSize:11,color:COLORS.textSecondary}}>{currentUser.role}</div>
              </div>
              <button
                onClick={()=>setCurrentUser(null)}
                title="Sign out"
                style={{
                  background:"#F2F4F6",border:"1px solid #D8DCE6",borderRadius:6,
                  padding:"6px 10px",cursor:"pointer",fontSize:12,color:COLORS.textSecondary,
                  fontWeight:500,display:"flex",alignItems:"center",gap:4,
                }}
              >
                <X size={13}/> Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
