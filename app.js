// Banco local simples
const getDB = (k) => JSON.parse(localStorage.getItem(k)) || [];
const setDB = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// 1. PRODUTOS
function getProdutos() { return getDB("produtos"); }
function salvarProduto(p) {
  const l = getProdutos();
  p.id ? l.splice(l.findIndex(x => x.id === p.id), 1, p) : l.push({ ...p, id: Date.now().toString() });
  setDB("produtos", l);
}
function excluirProduto(id) { setDB("produtos", getProdutos().filter(x => x.id !== id)); }

// 2. CLIENTES
function getClientes() { return getDB("clientes"); }
function salvarCliente(c) {
  const l = getClientes();
  c.id ? l.splice(l.findIndex(x => x.id === c.id), 1, c) : l.push({ ...c, id: Date.now().toString() });
  setDB("clientes", l);
}
function excluirCliente(id) { setDB("clientes", getClientes().filter(x => x.id !== id)); }

// 3. CARRINHO
function getCarrinho() { return getDB("carrinho"); }
function adicionarCarrinho(produtoId, qtd) {
  const l = getCarrinho();
  const item = l.find(x => x.produtoId === produtoId);
  item ? item.qtd += qtd : l.push({ produtoId, qtd });
  setDB("carrinho", l);
}
function removerCarrinho(produtoId) { setDB("carrinho", getCarrinho().filter(x => x.produtoId !== produtoId)); }

// 4. VENDAS
function getVendas() { return getDB("vendas"); }
function finalizarVenda(clienteId) {
  const carrinho = getCarrinho();
  if (!carrinho.length) return;
  const produtos = getProdutos();
  const cliente = getClientes().find(x => x.id === clienteId);

  const itens = carrinho.map(i => {
    const p = produtos.find(x => x.id === i.produtoId);
    return { nome: p ? p.nome : "Item", preco: p ? p.preco : 0, qtd: i.qtd };
  });

  const venda = {
    id: Date.now().toString(),
    data: new Date().toLocaleDateString(),
    clienteNome: cliente ? cliente.nome : "Visitante",
    itens: itens,
    total: itens.reduce((s, i) => s + (i.preco * i.qtd), 0)
  };

  const vendas = getVendas();
  vendas.push(venda);
  setDB("vendas", vendas);
  localStorage.removeItem("carrinho");
}

// CAMADA MÍNIMA DE UI (Integração Direta)
document.addEventListener("DOMContentLoaded", () => {
  // TEMA
  const btnTema = document.getElementById("tema") || document.getElementById("tema-mobile");
  if (btnTema) {
    btnTema.addEventListener("click", () => {
      const h = document.documentElement;
      h.dataset.bsTheme = h.dataset.bsTheme === "dark" ? "light" : "dark";
    });
  }

  // PAINEL (index.html)
  const indVendas = document.getElementById("ind-vendas");
  if (indVendas) {
    const v = getVendas();
    indVendas.textContent = v.length;
    document.getElementById("ind-clientes").textContent = getClientes().length;
    document.getElementById("ind-estoque").textContent = getProdutos().reduce((s, p) => s + Number(p.estoque || 0), 0);
    document.getElementById("ind-faturacao").textContent = "R$ " + v.reduce((s, x) => s + x.total, 0).toFixed(2);
  }

  // PRODUTOS (produtos.html)
  const tp = document.getElementById("tp");
  if (tp) {
    function renderProd() {
      tp.innerHTML = getProdutos().map(p => `
        <div class="col">
          <div class="card bg-body-tertiary border-secondary h-100 p-3">
            <h5>${p.nome}</h5>
            <p>R$ ${p.preco} | Estoque: ${p.estoque}</p>
            <button class="btn btn-sm btn-danger mt-auto" onclick="delProd('${p.id}')">Excluir</button>
          </div>
        </div>
      `).join("") || '<p class="text-secondary">Nenhum produto cadastrado.</p>';
    }
    window["delProd"] = (id) => { excluirProduto(id); renderProd(); };

    document.getElementById("Produto")?.addEventListener("click", () => {
      document.getElementById("fProd").reset();
      const modalEl = document.getElementById("mProd");
      if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });

    document.getElementById("fProd")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      salvarProduto({
        nome: f.nome.value,
        cat: f.cat.value,
        preco: parseFloat(f.preco.value),
        estoque: parseInt(f.estoque.value)
      });
      f.reset();
      bootstrap.Modal.getInstance(document.getElementById("mProd"))?.hide();
      renderProd();
    });
    renderProd();
  }

  // CLIENTES (clientes.html)
  const tcli = document.getElementById("tcli");
  if (tcli) {
    function renderCli() {
      tcli.innerHTML = getClientes().map(c => `
        <tr>
          <td>${c.nome}</td><td>${c.cpf}</td><td>${c.email}</td><td>${c.tele}</td>
          <td><button class="btn btn-sm btn-danger" onclick="delCli('${c.id}')">Excluir</button></td>
        </tr>
      `).join("") || '<tr><td colspan="5" class="text-secondary">Nenhum cliente cadastrado.</td></tr>';
    }
    window["delCli"] = (id) => { excluirCliente(id); renderCli(); };

    document.getElementById("novoCli")?.addEventListener("click", () => {
      document.getElementById("fCli").reset();
      const modalEl = document.getElementById("mCli");
      if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });

    document.getElementById("fCli")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      salvarCliente({
        nome: f.nome.value,
        cpf: f.cpf.value,
        email: f.email.value,
        tele: f.tele.value
      });
      f.reset();
      bootstrap.Modal.getInstance(document.getElementById("mCli"))?.hide();
      renderCli();
    });
    renderCli();
  }

  // CARRINHO (carrinho.html)
  const tc = document.getElementById("tc");
  if (tc) {
    function renderCarrinho() {
      const prods = getProdutos();
      const carr = getCarrinho();

      // Select Clientes
      const cc = document.getElementById("cc");
      if (cc) cc.innerHTML = getClientes().map(c => `<option value="${c.id}">${c.nome}</option>`).join("");

      // Select Produtos
      const cp = document.getElementById("cp");
      if (cp) cp.innerHTML = prods.map(p => `<option value="${p.id}">${p.nome} (R$ ${p.preco})</option>`).join("");

      // Tabela Carrinho
      tc.innerHTML = carr.map(i => {
        const p = prods.find(x => x.id === i.produtoId) || {};
        return `
          <tr>
            <td>${p.nome || "Item"}</td>
            <td>${i.qtd}</td>
            <td>R$ ${((p.preco || 0) * i.qtd).toFixed(2)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="delCarrinho('${i.produtoId}')">Remover</button></td>
          </tr>
        `;
      }).join("") || '<tr><td colspan="4" class="text-secondary">Carrinho vazio.</td></tr>';

      const total = carr.reduce((s, i) => {
        const p = prods.find(x => x.id === i.produtoId) || {};
        return s + ((p.preco || 0) * i.qtd);
      }, 0);

      const res = document.getElementById("res");
      if (res) res.innerHTML = `<dt class="col-6">Total</dt><dd class="col-6 text-end fw-bold">R$ ${total.toFixed(2)}</dd>`;
    }

    window["delCarrinho"] = (id) => { removerCarrinho(id); renderCarrinho(); };

    document.getElementById("add")?.addEventListener("click", () => {
      const pid = document.getElementById("cp").value;
      const qtd = parseInt(document.getElementById("cq").value) || 1;
      if (pid) { adicionarCarrinho(pid, qtd); renderCarrinho(); }
    });

    document.getElementById("fin")?.addEventListener("click", () => {
      const clienteId = document.getElementById("cc").value;
      if (!clienteId) { alert("Selecione um cliente"); return; }
      finalizarVenda(clienteId);
      renderCarrinho();
      alert("Compra finalizada com sucesso!");
    });

    renderCarrinho();
  }

  // VENDAS (vendas.html)
  const tv = document.getElementById("tv");
  if (tv) {
    const vendas = getVendas();
    tv.innerHTML = vendas.map(v => `
      <tr>
        <td>#${v.id.slice(-4)} (${v.data})</td>
        <td>${v.clienteNome}</td>
        <td>${v.itens.map(i => `${i.qtd}x ${i.nome}`).join(", ")}</td>
        <td>R$ ${v.total.toFixed(2)}</td>
      </tr>
    `).join("") || '<tr><td colspan="4" class="text-secondary">Nenhuma venda registrada.</td></tr>';
  }
});
