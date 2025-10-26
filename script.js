'use strict';

/* ===================== Estado / util ===================== */
const KEY='dist-op-v2', AUTH='dist-auth';
const seed={
  usuarios:[{id:'u1',nome:'Admin',email:'admin@dist.com',role:'ADMIN',senha:'admin123'}],
  produtos:[
    {id:'p1',sku:'AMOX-500',nome:'Amoxicilina 500mg',fabricante:'Farmabem',categoria:'Antibiótico',preco:12.9,estoque:180,validade:'2026-02-01',lote:'AX23',status:'ATIVO'},
    {id:'p2',sku:'DIP-1G',nome:'Dipirona 1g',fabricante:'Saúde+Lab',categoria:'Analgésico',preco:3.5,estoque:1200,validade:'2027-08-10',lote:'DP55',status:'ATIVO'},
    {id:'p3',sku:'SF-0.9',nome:'Soro Fisiológico 0,9% 500ml',fabricante:'HospCare',categoria:'Solução',preco:5.7,estoque:350,validade:'2026-05-30',lote:'SF09',status:'ATIVO'}
  ],
  fornecedores:[
    {id:'f1',nome:'BioPharma S.A.',cnpj:'11.111.111/0001-11',contato:'forn@bio.com',prazo:15},
    {id:'f2',nome:'HospTrade Ltda',cnpj:'22.222.222/0001-22',contato:'contato@hosptrade.com',prazo:28}
  ],
  movimentos:[
    // exemplos
    {id:'mv1',quando:'2025-10-20T10:30:00Z',tipo:'ENTRADA (PC)',produtoId:'p1',produtoNome:'Amoxicilina 500mg',qtd:50,obs:'PC0001'},
    {id:'mv2',quando:'2025-10-21T09:00:00Z',tipo:'SAÍDA',produtoId:'p2',produtoNome:'Dipirona 1g',qtd:-20,obs:'Ajuste de inventário'}
  ],
  compras:[]
};
if(!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(seed));
const db=()=>JSON.parse(localStorage.getItem(KEY));
const setDb=(fn)=>{const d=db();const n=fn(JSON.parse(JSON.stringify(d)));localStorage.setItem(KEY,JSON.stringify(n));return n;};
const q=(s,c=document)=>c.querySelector(s);
const on=(el,ev,fn)=>(typeof el==='string'?q(el):el).addEventListener(ev,fn);
const BRL=(n)=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmtDate=(iso)=>new Date(iso).toLocaleDateString('pt-BR');
const fmtDateTime=(iso)=>new Date(iso).toLocaleString('pt-BR');
const uid=(p='id')=>p+Math.random().toString(36).slice(2,9);

/* ===================== Toast / Modal ===================== */
const Toast={push(m){const h=q('#toast');if(!h)return;const e=document.createElement('div');e.className='item';e.textContent=m;h.appendChild(e);setTimeout(()=>e.remove(),3000);}};
function Modal(id,title,body){
  const html=`<div class="modal open" id="${id}"><div class="box">
    <div class="hd"><strong>${title}</strong><button class="btn" data-close>✕</button></div>
    <div class="bd">${body}</div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  const m=q('#'+id);
  m.addEventListener('click',e=>{ if(e.target.dataset.close!==undefined || e.target===m) m.remove(); });
  return m;
}

/* ===================== Login ===================== */
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
    if(!u) return alert('Credenciais inválidas');
    localStorage.setItem(AUTH, JSON.stringify(u));
    start();
  });
}

/* ===================== Telas ===================== */
function Dashboard(){
  const d=db();
  const estoqueTotal=d.produtos.reduce((s,p)=>s+p.estoque,0);
  const vencendo = d.produtos.filter(p => new Date(p.validade) < new Date(Date.now()+1000*60*60*24*120)).length;
  return `<div class='h1'>Dashboard</div><div class='sub'>Visão operacional</div><div class='hr-accent'></div>
  <div class='grid cols-4'>
    <div class='card bd kpi'><div><h3>Produtos</h3><strong>${d.produtos.length}</strong></div><span class='badge ok'>ativo</span></div>
    <div class='card bd kpi'><div><h3>Estoque total</h3><strong>${estoqueTotal}</strong></div><span class='badge warn'>mov.</span></div>
    <div class='card bd kpi'><div><h3>Alertas de validade (120d)</h3><strong>${vencendo}</strong></div><span class='badge ${vencendo? 'danger':'ok'}'>${vencendo?'atenção':'ok'}</span></div>
    <div class='card bd kpi'><div><h3>Movimentos</h3><strong>${d.movimentos.length}</strong></div><span class='badge'>estoque</span></div>
  </div>`;
}

function Produtos(){
  const rows=db().produtos;
  return `<div class='h1'>Produtos</div><div class='sub'>Catálogo e saldos</div><div class='hr-accent'></div>
  <div style="overflow:auto">
    <table class="table">
      <thead><tr>
        <th>SKU</th><th>Nome</th><th>Fabricante</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Validade</th><th>Lote</th>
      </tr></thead>
      <tbody>
      ${rows.map(r=>`<tr>
        <td>${r.sku}</td><td>${r.nome}</td><td>${r.fabricante}</td><td>${r.categoria}</td>
        <td>${BRL(r.preco)}</td><td>${r.estoque}</td><td>${fmtDate(r.validade)}</td><td>${r.lote||''}</td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function Fornecedores(){
  const rows=db().fornecedores;
  const body = `
    <div class='h1'>Fornecedores</div><div class='sub'>Cadastro e prazos</div><div class='hr-accent'></div>
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <button class="btn primary line" id="novoF">Novo fornecedor</button>
    </div>
    <div style="overflow:auto">
      <table class="table"><thead><tr>
        <th>Nome</th><th>CNPJ</th><th>Contato</th><th>Prazo (dias)</th><th>Ações</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td>${r.nome}</td><td>${r.cnpj}</td><td>${r.contato}</td><td>${r.prazo}</td>
        <td><button class="btn" data-edit="${r.id}">Editar</button>
            <button class="btn" data-del="${r.id}">Excluir</button></td>
      </tr>`).join('')}
      </tbody></table>
    </div>`;
  setTimeout(()=>{
    on('#novoF','click',()=>formF());
    document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>formF(b.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>delF(b.dataset.del)));
  });
  return body;

  function formF(id){
    const all=db().fornecedores;
    const it=id? all.find(x=>x.id===id):{nome:'',cnpj:'',contato:'',prazo:15};
    const m=Modal('mF', id?'Editar fornecedor':'Novo fornecedor', `
      <form id='fF' class='grid' style='gap:12px'>
        <div class='field'><div class='label'>Nome</div><input class='input' name='nome' value='${it.nome}' required></div>
        <div class='form-row'>
          <div class='field'><div class='label'>CNPJ</div><input class='input' name='cnpj' value='${it.cnpj}'></div>
          <div class='field'><div class='label'>Prazo (dias)</div><input class='input' type='number' name='prazo' value='${it.prazo||15}'></div>
        </div>
        <div class='field'><div class='label'>Contato</div><input class='input' name='contato' value='${it.contato||''}'></div>
        <div style='display:flex;justify-content:flex-end;gap:10px'>
          <button class='btn' data-close>Cancelar</button>
          <button class='btn primary' type='submit'>Salvar</button>
        </div>
      </form>`);
    on('#fF','submit',e=>{
      e.preventDefault();
      const data=Object.fromEntries(new FormData(e.target).entries()); data.prazo=parseInt(data.prazo||'0');
      setDb(d=>{
        if(id){ const i=d.fornecedores.findIndex(x=>x.id===id); d.fornecedores[i]={...d.fornecedores[i],...data}; }
        else d.fornecedores.push({id:uid('f'),...data});
        return d;
      });
      m.remove(); route();
    });
  }
  function delF(id){
    if(!confirm('Excluir fornecedor?')) return;
    setDb(d=>{ d.fornecedores=d.fornecedores.filter(x=>x.id!==id); return d; });
    route();
  }
}

function Estoque(){
  const d=db();
  const rows=d.movimentos.slice().reverse();
  const body = `
    <div class='h1'>Estoque</div><div class='sub'>Entradas/Saídas e alertas de validade</div><div class='hr-accent'></div>
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <button class="btn primary line" id="novaMov">Nova movimentação</button>
    </div>
    <div class="card bd" style="margin-bottom:14px">
      <strong>Alertas de validade (próximos 120 dias)</strong>
      <div style="overflow:auto;margin-top:8px">
        <table class="table"><thead><tr><th>Produto</th><th>Lote</th><th>Validade</th><th>Estoque</th></tr></thead>
        <tbody>
          ${
            d.produtos.filter(p=> new Date(p.validade) < new Date(Date.now()+1000*60*60*24*120))
              .map(p=>`<tr><td>${p.nome}</td><td>${p.lote||'-'}</td><td><span class="badge danger">${fmtDate(p.validade)}</span></td><td>${p.estoque}</td></tr>`).join('') ||
            `<tr><td colspan="4"><span class="sub">Sem itens críticos.</span></td></tr>`
          }
        </tbody></table>
      </div>
    </div>
    <div class="card bd">
      <strong>Movimentações recentes</strong>
      <div style="overflow:auto;margin-top:8px">
        <table class="table"><thead><tr>
          <th>Quando</th><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Obs</th>
        </tr></thead><tbody>
          ${
            rows.map(r=>`<tr>
              <td>${fmtDateTime(r.quando)}</td>
              <td>${r.tipo}</td>
              <td>${r.produtoNome}</td>
              <td>${r.qtd}</td>
              <td>${r.obs||''}</td>
            </tr>`).join('')
            || `<tr><td colspan="5"><span class="sub">Sem movimentações.</span></td></tr>`
          }
        </tbody></table>
      </div>
    </div>`;
  setTimeout(()=> on('#novaMov','click',()=>formMov()));
  return body;

  function formMov(){
    const d=db();
    const m=Modal('mMv','Nova movimentação', `
      <form id='fMv' class='grid' style='gap:12px'>
        <div class='form-row'>
          <div class='field'><div class='label'>Produto</div>
            <select class='select' name='pid' required>
              ${d.produtos.map(p=>`<option value='${p.id}'>${p.nome} (${p.sku}) — estoque ${p.estoque}</option>`).join('')}
            </select>
          </div>
          <div class='field'><div class='label'>Tipo</div>
            <select class='select' name='tipo'><option>ENTRADA</option><option>SAÍDA</option></select>
          </div>
        </div>
        <div class='form-row'>
          <div class='field'><div class='label'>Quantidade</div><input class='input' type='number' name='qtd' value='1' required></div>
          <div class='field'><div class='label'>Observação</div><input class='input' name='obs' placeholder='ex: ajuste, perda, conferência'></div>
        </div>
        <div style='display:flex;justify-content:flex-end;gap:10px'>
          <button class='btn' data-close>Cancelar</button>
          <button class='btn primary' type='submit'>Salvar</button>
        </div>
      </form>`);
    on('#fMv','submit',e=>{
      e.preventDefault();
      const v=Object.fromEntries(new FormData(e.target).entries());
      const qtd=parseInt(v.qtd||'0'); if(!qtd) return;
      setDb(d=>{
        const p=d.produtos.find(x=>x.id===v.pid);
        const delta = (v.tipo==='ENTRADA'? +qtd : -qtd);
        p.estoque = Math.max(0, (p.estoque||0) + delta);
        const tipoLabel = v.tipo==='ENTRADA' ? 'ENTRADA' : 'SAÍDA';
        d.movimentos.push({id:uid('mv'),quando:new Date().toISOString(),tipo:tipoLabel,produtoId:p.id,produtoNome:p.nome,qtd:delta,obs:v.obs||''});
        return d;
      });
      Toast.push('Movimentação registrada'); m.remove(); route();
    });
  }
}

/* ---------- Relatórios (impressão) ---------- */
function Relatorios(){
  const d=db();
  const today = new Date().toISOString().slice(0,10);

  const view = `
    <div class='h1'>Relatórios</div><div class='sub'>Impressão de entradas, baixas e produtos</div><div class='hr-accent'></div>

    <div class="card bd no-print" style="margin-bottom:12px">
      <div class="form-row">
        <div class="field">
          <div class="label">Tipo de relatório</div>
          <select id="relTipo" class="select">
            <option value="entradas">Entradas</option>
            <option value="saidas">Baixas</option>
            <option value="produtos">Produtos em estoque</option>
          </select>
        </div>
        <div class="field" id="df">
          <div class="label">De</div>
          <input id="dataIni" type="date" class="input" value="${today}">
        </div>
        <div class="field" id="dt">
          <div class="label">Até</div>
          <input id="dataFim" type="date" class="input" value="${today}">
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn" id="gerar">Gerar</button>
        <button class="btn primary line" id="imprimir">Imprimir</button>
      </div>
    </div>

    <div id="printArea" class="card bd">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong id="tituloRel">Relatório</strong><div class="sub" id="subRel"></div></div>
        <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      </div>
      <div id="tblRel" style="margin-top:10px"></div>
    </div>
  `;

  // pós-render
  setTimeout(()=>{
    const tipoSel = q('#relTipo');
    const ini = q('#dataIni');
    const fim = q('#dataFim');
    const titulo = q('#tituloRel');
    const sub = q('#subRel');
    const tbl = q('#tblRel');

    function render(){
      const tipo = tipoSel.value;
      if(tipo==='produtos'){
        q('#df').style.display='none';
        q('#dt').style.display='none';
        titulo.textContent='Relatório de Produtos em Estoque';
        sub.textContent=`Total de itens: ${d.produtos.length}`;
        tbl.innerHTML = `
          <div style="overflow:auto">
            <table class="table"><thead><tr>
              <th>SKU</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Validade</th><th>Lote</th>
            </tr></thead><tbody>
              ${d.produtos.map(p=>`<tr>
                <td>${p.sku}</td><td>${p.nome}</td><td>${p.categoria}</td><td>${BRL(p.preco)}</td>
                <td>${p.estoque}</td><td>${fmtDate(p.validade)}</td><td>${p.lote||''}</td>
              </tr>`).join('')}
            </tbody></table>
          </div>`;
        return;
      }
      // movimentos (entradas/saidas)
      q('#df').style.display='grid';
      q('#dt').style.display='grid';
      const di = new Date(ini.value+'T00:00:00');
      const df_ = new Date(fim.value+'T23:59:59');
      const isEntrada = tipo==='entradas';
      const rows = d.movimentos.filter(m=>{
        const okTipo = isEntrada? (m.qtd>0 || /ENTRADA/i.test(m.tipo)) : (m.qtd<0 || /SAÍDA/i.test(m.tipo));
        const t = new Date(m.quando);
        return okTipo && t>=di && t<=df_;
      });
      titulo.textContent = isEntrada? 'Relatório de Entradas' : 'Relatório de Baixas';
      sub.textContent = `Período: ${fmtDate(ini.value)} a ${fmtDate(fim.value)} • Registros: ${rows.length}`;
      tbl.innerHTML = `
        <div style="overflow:auto">
          <table class="table"><thead><tr>
            <th>Data/Hora</th><th>Tipo</th><th>Produto</th><th>Quantidade</th><th>Observação</th>
          </tr></thead><tbody>
            ${rows.map(r=>`<tr>
              <td>${fmtDateTime(r.quando)}</td>
              <td>${r.tipo}</td>
              <td>${r.produtoNome}</td>
              <td>${r.qtd}</td>
              <td>${r.obs||''}</td>
            </tr>`).join('') || `<tr><td colspan="5"><span class="sub">Sem registros no período.</span></td></tr>`}
          </tbody></table>
        </div>`;
    }

    on('#gerar','click',render);
    on('#imprimir','click',()=>window.print());
    on('#relTipo','change',render);
    render(); // primeira renderização
  });

  return view;
}

/* ===================== Layout / Rotas / Sessão ===================== */
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
        <a class='nav-item' href='#/estoque'>📦 Estoque</a>
        <a class='nav-item' href='#/compras'>🧾 Compras</a>
        <a class='nav-item' href='#/fornecedores'>🏭 Fornecedores</a>
        <a class='nav-item' href='#/relatorios'>📑 Relatórios</a>
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
  window.addEventListener('hashchange', route);
}

function route(){
  const h=location.hash||'#/dashboard';
  const view=q('#view'); if(!view) return;
  q('[href].active')?.classList.remove('active');
  q(`[href="${h}"]`)?.classList.add('active');
  if(h==='#/dashboard') view.innerHTML=Dashboard();
  else if(h==='#/produtos') view.innerHTML=Produtos();
  else if(h==='#/fornecedores') view.innerHTML=Fornecedores();
  else if(h==='#/estoque') view.innerHTML=Estoque();
  else if(h==='#/compras') view.innerHTML='<!-- (mantido para futuras evoluções) -->'+Estoque(); /* placeholder */
  else if(h==='#/relatorios') view.innerHTML=Relatorios();
  else view.innerHTML='<div class="sub">Não encontrado</div>';
}

/* ===================== Boot ===================== */
function start(){
  const u=getUser();
  if(!u){ q('#app').innerHTML=Login(); bindLogin(); return; }
  renderLayout(); route();
}
document.addEventListener('DOMContentLoaded', start);
