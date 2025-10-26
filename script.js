'use strict';

// ========= Estado / util =========
const KEY='dist-simple-v1', AUTH='dist-auth';
const seed={
  usuarios:[{id:'u1',nome:'Admin',email:'admin@dist.com',role:'ADMIN',senha:'admin123'}],
  produtos:[
    {id:'p1',sku:'AMOX-500',nome:'Amoxicilina 500mg',fabricante:'Farmabem',categoria:'Antibiótico',preco:12.9,estoque:180,validade:'2026-02-01',status:'ATIVO'},
    {id:'p2',sku:'DIP-1G',nome:'Dipirona 1g',fabricante:'Saúde+Lab',categoria:'Analgésico',preco:3.5,estoque:1200,validade:'2027-08-10',status:'ATIVO'}
  ]
};
if(!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(seed));
const db=()=>JSON.parse(localStorage.getItem(KEY));
const setDb=(fn)=>{const d=db();const n=fn(structuredClone?structuredClone(d):JSON.parse(JSON.stringify(d)));localStorage.setItem(KEY,JSON.stringify(n));return n;};
const q=(s,c=document)=>c.querySelector(s);
const on=(el,ev,fn)=>(typeof el==='string'?q(el):el).addEventListener(ev,fn);
const BRL=(n)=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmtDate=(iso)=>new Date(iso).toLocaleDateString('pt-BR');

// ========= Toast / Modal =========
const Toast={push(m){const h=q('#toast');if(!h)return;const e=document.createElement('div');e.className='item';e.textContent=m;h.appendChild(e);setTimeout(()=>e.remove(),3000);}};
function Modal(id,t,b){
  const html=`<div class="modal open" id="${id}"><div class="box"><div class="hd"><strong>${t}</strong><button class="btn" data-close>✕</button></div><div class="bd">${b}</div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  const m=q('#'+id);
  m.addEventListener('click',e=>{if(e.target.dataset.close!==undefined||e.target===m)m.remove();});
  return m;
}

// ========= Login =========
function Login(){
  return `<div class='login'><div class='login-card'>
    <div class='login-banner'></div>
    <div class='bd' style='padding:22px'>
      <h2 style='margin:0 0 6px'>Acessar painel</h2>
      <div class='sub'>Use <b>admin@dist.com</b> / <b>admin123</b></div>
      <div style='height:1px;background:var(--border);margin:14px 0'></div>
      <form id='formLogin' class='grid' style='gap:12px'>
        <div class='field'><div class='label'>E-mail</div><input class='input' name='email' value='admin@dist.com' required></div>
        <div class='field'><div class='label'>Senha</div><input class='input' type='password' name='senha' value='admin123' required></div>
        <button class='btn primary line' type='submit'>Entrar</button>
      </form>
    </div></div></div>`;
}
function bindLogin(){
  const f=q('#formLogin'); if(!f) return;
  f.addEventListener('submit',e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(f).entries());
    const u=db().usuarios.find(x=>x.email===d.email&&x.senha===d.senha);
    if(!u){alert('Credenciais inválidas');return;}
    localStorage.setItem(AUTH,JSON.stringify(u));
    start();
  });
}

// ========= Telas =========
function Dashboard(){
  const d=db();
  const total=d.produtos.length, estoque=d.produtos.reduce((s,p)=>s+p.estoque,0);
  return `<div class='h1'>Dashboard</div><div class='sub'>Visão geral</div><div class='hr-accent'></div>
  <div class='grid cols-4'>
    <div class='card bd kpi'><div><h3>Produtos</h3><strong>${total}</strong></div><span class='badge ok'>+2</span></div>
    <div class='card bd kpi'><div><h3>Estoque total</h3><strong>${estoque}</strong></div><span class='badge warn'>-3%</span></div>
  </div>`;
}

function Produtos(){
  const rows=db().produtos;
  return `<div class='h1'>Produtos</div><div class='sub'>Cadastro e controle</div><div class='hr-accent'></div>
  ${rows.map(r=>`<div class='card bd'>${r.nome} — ${BRL(r.preco)} <span class='sub'>(x${r.estoque}, val: ${fmtDate(r.validade)})</span></div>`).join('')}`;
}

// ========= Layout / Rotas / Sessão =========
function getUser(){const v=localStorage.getItem(AUTH);return v?JSON.parse(v):null;}
function signOut(){localStorage.removeItem(AUTH);start();}

function renderLayout(){
  const u=getUser();
  q('#app').innerHTML=`<div class='app'>
    <aside class='sidebar' id='sidebar'>
      <div class='logo'><div class='mark'></div><div><b>Distribuidora</b><div class='sub'>Medicamentos & Hospitalar</div></div></div>
      <nav>
        <a class='nav-item' href='#/dashboard'>📊 Dashboard</a>
        <a class='nav-item' href='#/produtos'>💊 Produtos</a>
      </nav>
    </aside>
    <main>
      <div class='topbar'>
        <div class='search'>🔎 <input placeholder='Buscar (Ctrl+/)'></div>
        <div class='user'><span class='badge'>${u.role}</span><div class='avatar'></div><button class='btn' id='signOut'>Sair</button></div>
      </div>
      <div class='main' id='view'></div>
    </main>
    <div class='toast' id='toast'></div>
  </div>`;
  on('#signOut','click',signOut);
  window.addEventListener('hashchange',route);
}

function route(){
  const h=location.hash||'#/dashboard';
  const v=q('#view'); if(!v) return;
  if(h==='#/dashboard') v.innerHTML=Dashboard();
  else if(h==='#/produtos') v.innerHTML=Produtos();
  else v.innerHTML=`<div class='sub'>Em construção</div>`;
}

// ========= Boot (com fallback de erro) =========
function start(){
  try{
    const u=getUser();
    if(!u){ q('#app').innerHTML=Login(); bindLogin(); return; }
    renderLayout(); route();
  }catch(err){
    // Mostra erro na tela para não ficar branco
    const pre=document.createElement('pre');
    pre.textContent='Erro ao iniciar:\\n'+(err&&err.stack||err);
    pre.style.cssText='background:#1e293b;color:#fff;padding:16px;border-radius:12px;max-width:96vw;overflow:auto';
    document.body.innerHTML=''; document.body.appendChild(pre);
    console.error(err);
  }
}

// Garante DOM pronto mesmo com defer
document.addEventListener('DOMContentLoaded', start);
