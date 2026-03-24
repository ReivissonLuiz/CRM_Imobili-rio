
const DB_KEY = 'clientes_db';
const USERS_KEY = 'usuarios_db';
const WA_RAPIDAS_KEY = 'whatsapp_rapidas_por_usuario';
let usuarioLogado = null;

const ETAPAS_FUNIL = [
    { id: 'novo', nome: 'Novo Lead' },
    { id: 'tratativa', nome: 'Em Tratativa' },
    { id: 'documentacao', nome: 'Documentação' },
    { id: 'fechamento', nome: 'Fechamento' },
    { id: 'venda', nome: 'Venda' }
];

document.addEventListener('DOMContentLoaded', () => {
    inicializarBancos();
    verificarAutenticacao();
    configurarEventosLogin();
    configurarEventosApp();
});

function inicializarBancos() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify({ clientes: [] }));
    }
    let usuarios = [];

    try {
        const dadosUsuarios = localStorage.getItem(USERS_KEY);
        if (dadosUsuarios) {
            const parsed = JSON.parse(dadosUsuarios);
            usuarios = Array.isArray(parsed?.usuarios) ? parsed.usuarios : [];
        }
    } catch (erro) {
        usuarios = [];
    }

    const adminIndex = usuarios.findIndex(usuario => usuario.email === 'admin@leads.com');

    if (adminIndex === -1) {
        usuarios.push({
            id: Date.now(),
            nome: 'Administrador',
            email: 'admin@leads.com',
            cpf: '000.000.000-00',
            dataNascimento: '2000-01-01',
            senha: btoa('admin123'),
            role: 'admin',
            dataCriacao: new Date().toLocaleString('pt-BR'),
            ativo: true
        });
    } else {
        usuarios[adminIndex] = {
            ...usuarios[adminIndex],
            role: 'admin',
            senha: btoa('admin123'),
            ativo: true
        };
    }

    localStorage.setItem(USERS_KEY, JSON.stringify({ usuarios }));
}

function verificarAutenticacao() {
    const usuarioSessionStorage = sessionStorage.getItem('usuarioLogado');
    if (usuarioSessionStorage) {
        usuarioLogado = JSON.parse(usuarioSessionStorage);
        mostrarApp();
    } else {
        mostrarLogin();
    }
}

function obterUsuarios() {
    try {
        const dados = localStorage.getItem(USERS_KEY);
        if (!dados) return [];
        const parsed = JSON.parse(dados);
        return Array.isArray(parsed?.usuarios) ? parsed.usuarios : [];
    } catch (erro) {
        return [];
    }
}

function salvarUsuarios(usuarios) {
    localStorage.setItem(USERS_KEY, JSON.stringify({ usuarios }));
}

function criarConta(nome, email, cpf, dataNascimento, senha) {
    const usuarios = obterUsuarios();
    
    if (usuarios.find(u => u.email === email)) {
        return { sucesso: false, erro: 'Email já cadastrado' };
    }

    const novoUsuario = {
        id: Date.now(),
        nome,
        email,
        cpf,
        dataNascimento,
        senha: btoa(senha), 
        role: usuarios.length === 0 ? 'admin' : 'corretor',
        dataCriacao: new Date().toLocaleString('pt-BR'),
        ativo: true
    };

    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);
    return { sucesso: true, usuario: novoUsuario };
}

function criarContaAdmin(nome, email, cpf, dataNascimento, senha, role) {
    const usuarios = obterUsuarios();
    
    if (usuarios.find(u => u.email === email)) {
        return { sucesso: false, erro: 'Email já cadastrado' };
    }

    const novoUsuario = {
        id: Date.now(),
        nome,
        email,
        cpf,
        dataNascimento,
        senha: btoa(senha),
        role: role || 'corretor',
        dataCriacao: new Date().toLocaleString('pt-BR'),
        ativo: true
    };

    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);
    return { sucesso: true, usuario: novoUsuario };
}

function fazerLogin(email, senha) {
    const usuarios = obterUsuarios();
    const usuario = usuarios.find(u => u.email === email && u.senha === btoa(senha));

    if (!usuario) {
        return { sucesso: false, erro: 'Email ou senha inválidos' };
    }

    usuarioLogado = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    return { sucesso: true, usuario: usuarioLogado };
}

function logout() {
    sessionStorage.removeItem('usuarioLogado');
    usuarioLogado = null;
    mostrarLogin();

    const msgEl = document.getElementById('msg-login');
    if (msgEl) {
        msgEl.textContent = '✓ Logout realizado com sucesso.';
        msgEl.className = 'mensagem sucesso';
        setTimeout(() => {
            msgEl.className = 'mensagem';
        }, 3500);
    }

    mostrarToast('Logout realizado com sucesso!');
}

function mostrarLogin() {
    document.getElementById('tela-login').classList.add('active');
    document.getElementById('app-principal').style.display = 'none';
}

function mostrarApp() {
    document.getElementById('tela-login').classList.remove('active');
    document.getElementById('app-principal').style.display = 'block';
    
    document.getElementById('user-name').textContent = usuarioLogado.nome;
    document.getElementById('user-role').textContent = usuarioLogado.role === 'admin' ? 'Administrador' : 'Corretor';
    
    const tabUsuarios = document.getElementById('tab-usuarios');
    if (usuarioLogado.role === 'admin') {
        tabUsuarios.style.display = 'inline-block';
    } else {
        tabUsuarios.style.display = 'none';
    }

    inicializarBD();
    atualizarEstatisticas();
    atualizarListaClientes();
    renderizarMensagensRapidasWhatsApp();
}

function configurarEventosLogin() {
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        
        const resultado = fazerLogin(email, senha);
        
        if (resultado.sucesso) {
            document.getElementById('form-login').reset();
            mostrarApp();
            mostrarToast('Login realizado com sucesso!');
        } else {
            const msgEl = document.getElementById('msg-login');
            msgEl.textContent = '✗ ' + resultado.erro;
            msgEl.className = 'mensagem erro';
            setTimeout(() => msgEl.className = 'mensagem', 4000);
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        logout();
    });
}

function configurarEventosApp() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'clientes') {
                atualizarListaClientes();
            } else if (tabName === 'usuarios') {
                atualizarListaUsuarios();
            } else if (tabName === 'whatsapp') {
                renderizarMensagensRapidasWhatsApp();
            }
        });
    });

    document.getElementById('form-cliente').addEventListener('submit', (e) => {
        e.preventDefault();
        const dados = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            profissao: document.getElementById('profissao').value,
            renda: document.getElementById('renda').value,
            dependentes: document.getElementById('dependentes').value,
            regiao: document.getElementById('regiao').value,
            tipoImovel: document.getElementById('tipo-imovel').value,
            entrada: document.getElementById('entrada').value,
            temCocomprador: document.getElementById('tem-cocomprador').checked,
            cocompradorNome: document.getElementById('cc-nome') ? document.getElementById('cc-nome').value : '',
            cocompradorCpf: document.getElementById('cc-cpf') ? document.getElementById('cc-cpf').value : '',
            cocompradorProfissao: document.getElementById('cc-profissao') ? document.getElementById('cc-profissao').value : '',
            cocompradorRenda: document.getElementById('cc-renda') ? document.getElementById('cc-renda').value : '',
            anotacoes: document.getElementById('anotacoes').value
        };

        try {
            adicionarCliente(dados);
            document.getElementById('form-cliente').reset();
            if (document.getElementById('cocomprador-fields')) {
                document.getElementById('cocomprador-fields').style.display = 'none';
            }
            mostrarMensagem('✓ Lead adicionado com sucesso!', 'sucesso');
        } catch (erro) {
            mostrarMensagem('✗ Erro ao adicionar lead', 'erro');
        }
    });

    const checkboxCocompradorNovoLead = document.getElementById('tem-cocomprador');
    if (checkboxCocompradorNovoLead) {
        checkboxCocompradorNovoLead.addEventListener('change', function() {
            const cocompradorFields = document.getElementById('cocomprador-fields');
            if (!cocompradorFields) return;

            cocompradorFields.style.display = this.checked ? 'block' : 'none';

            if (!this.checked) {
                cocompradorFields.querySelectorAll('input').forEach(input => {
                    input.value = '';
                });
            }
        });
    }

    document.getElementById('search-cliente').addEventListener('input', () => {
        atualizarListaClientes();
    });

    const formWhatsApp = document.getElementById('form-whatsapp');
    if (formWhatsApp) {
        formWhatsApp.addEventListener('submit', (e) => {
            e.preventDefault();

            const numeroInput = document.getElementById('wa-numero').value;
            const mensagemInput = document.getElementById('wa-mensagem').value || '';
            const numero = (numeroInput || '').replace(/\D/g, '');

            if (!numero || numero.length < 10) {
                mostrarMensagem('✗ Informe um número válido com DDD e código do país', 'erro');
                return;
            }

            const url = `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagemInput)}`;
            window.open(url, '_blank');
            mostrarMensagem('✓ Redirecionando para o WhatsApp Web...', 'sucesso');
        });
    }

    const btnToggleRapidaForm = document.getElementById('btn-toggle-rapida-form');
    if (btnToggleRapidaForm) {
        btnToggleRapidaForm.addEventListener('click', () => {
            const formContainer = document.getElementById('wa-rapida-form-container');
            if (!formContainer) return;

            const abriu = formContainer.style.display === 'none';
            formContainer.style.display = abriu ? 'block' : 'none';
            btnToggleRapidaForm.classList.toggle('active', abriu);
        });
    }

    const btnSalvarRapida = document.getElementById('btn-salvar-rapida');
    if (btnSalvarRapida) {
        btnSalvarRapida.addEventListener('click', () => {
            const nome = (document.getElementById('wa-rapida-nome').value || '').trim();
            const texto = (document.getElementById('wa-rapida-texto').value || '').trim();

            if (!nome || !texto) {
                mostrarMensagem('✗ Preencha o nome e o texto da mensagem rápida', 'erro');
                return;
            }

            const mensagens = obterMensagensRapidasUsuario();
            const indiceExistente = mensagens.findIndex(msg => msg.nome.toLowerCase() === nome.toLowerCase());

            if (indiceExistente >= 0) {
                mensagens[indiceExistente].texto = texto;
                mensagens[indiceExistente].atualizadoEm = new Date().toISOString();
            } else {
                mensagens.push({
                    id: Date.now().toString(),
                    nome,
                    texto,
                    criadoEm: new Date().toISOString()
                });
            }

            salvarMensagensRapidasUsuario(mensagens);
            renderizarMensagensRapidasWhatsApp();
            document.getElementById('wa-rapida-nome').value = '';
            document.getElementById('wa-rapida-texto').value = '';
            const formContainer = document.getElementById('wa-rapida-form-container');
            const btnToggle = document.getElementById('btn-toggle-rapida-form');
            if (formContainer) {
                formContainer.style.display = 'none';
            }
            if (btnToggle) {
                btnToggle.classList.remove('active');
            }
            mostrarMensagem('✓ Mensagem rápida salva para este usuário', 'sucesso');
        });
    }

    document.querySelector('.close').addEventListener('click', fecharModal);
    document.querySelector('.close-usuario').addEventListener('click', fecharModalUsuario);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-cliente')) {
            fecharModal();
        }
        if (e.target === document.getElementById('modal-usuario')) {
            fecharModalUsuario();
        }
    });

    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-modal-tab');
            ativarTabModal(tabName);
        });
    });

    document.getElementById('modal-tem-cocomprador').addEventListener('change', function() {
        const btnTabCocomprador = document.getElementById('tab-cocomprador-btn');
        if (this.checked) {
            btnTabCocomprador.style.display = 'block';
        } else {
            btnTabCocomprador.style.display = 'none';
            limparFormCocomprador();
        }
    });

    document.getElementById('btn-salvar').addEventListener('click', () => {
        const clienteId = document.getElementById('form-editar').dataset.clienteId;
        const dados = {
            nome: document.getElementById('modal-nome').value,
            cpf: document.getElementById('modal-cpf').value,
            profissao: document.getElementById('modal-profissao').value,
            renda: document.getElementById('modal-renda').value,
            dependentes: document.getElementById('modal-dependentes').value,
            regiao: document.getElementById('modal-regiao').value,
            tipoImovel: document.getElementById('modal-tipo-imovel').value,
            entrada: document.getElementById('modal-entrada').value,
            temCocomprador: document.getElementById('modal-tem-cocomprador').checked,
            etapaFunil: document.getElementById('modal-etapa-funil').value,
            anotacao: document.getElementById('modal-anotacao-nova').value
        };

        try {
            atualizarCliente(clienteId, dados);
            mostrarMensagem('✓ Lead atualizado com sucesso!', 'sucesso');
            fecharModal();
            atualizarListaClientes();
        } catch (erro) {
            mostrarMensagem('✗ Erro ao salvar alterações', 'erro');
        }
    });

    document.getElementById('btn-deletar').addEventListener('click', () => {
        if (confirm('⚠️ Tem certeza que deseja deletar este lead?')) {
            const clienteId = document.getElementById('form-editar').dataset.clienteId;
            try {
                deletarCliente(clienteId);
                mostrarMensagem('✓ Lead deletado com sucesso!', 'sucesso');
                fecharModal();
                atualizarListaClientes();
            } catch (erro) {
                mostrarMensagem('✗ Erro ao deletar lead', 'erro');
            }
        }
    });

    document.getElementById('btn-salvar-cocomprador').addEventListener('click', () => {
        const clienteId = document.getElementById('form-cocomprador').dataset.clienteId;
        const dados = {
            nome: document.getElementById('modal-cc-nome').value,
            cpf: document.getElementById('modal-cc-cpf').value,
            profissao: document.getElementById('modal-cc-profissao').value,
            renda: document.getElementById('modal-cc-renda').value
        };

        try {
            atualizarCocomprador(clienteId, dados);
            mostrarMensagem('✓ Co-comprador salvo com sucesso!', 'sucesso');
            atualizarListaClientes();
        } catch (erro) {
            mostrarMensagem('✗ Erro ao salvar co-comprador', 'erro');
        }
    });

    document.getElementById('btn-remover-cocomprador').addEventListener('click', () => {
        if (confirm('⚠️ Tem certeza?')) {
            const clienteId = document.getElementById('form-cocomprador').dataset.clienteId;
            try {
                removerCocomprador(clienteId);
                document.getElementById('modal-tem-cocomprador').checked = false;
                document.getElementById('tab-cocomprador-btn').style.display = 'none';
                limparFormCocomprador();
                mostrarMensagem('✓ Co-comprador removido!', 'sucesso');
                atualizarListaClientes();
            } catch (erro) {
                mostrarMensagem('✗ Erro ao remover co-comprador', 'erro');
            }
        }
    });

    document.getElementById('btn-exportar').addEventListener('click', () => {
        const dados = localStorage.getItem(DB_KEY);
        const blob = new Blob([dados], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_backup_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarMensagem('✓ Dados exportados!', 'sucesso');
    });

    document.getElementById('btn-exportar-txt').addEventListener('click', () => {
        const clientes = obterClientes();
        let conteudo = 'BACKUP DE LEADS\n==================\n';
        conteudo += `Data: ${new Date().toLocaleString('pt-BR')}\nTotal: ${clientes.length}\n\n`;

        clientes.forEach((cliente, idx) => {
            conteudo += `LEAD ${idx + 1}:\nNome: ${cliente.nome}\nCPF: ${cliente.cpf || '-'}\nRenda: R$ ${cliente.renda.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\nRegião: ${cliente.regiao || '-'}\n\n---\n\n`;
        });

        const blob = new Blob([conteudo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_backup_${new Date().getTime()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarMensagem('✓ Dados exportados como TXT!', 'sucesso');
    });

    document.getElementById('btn-importar').addEventListener('click', () => {
        const input = document.getElementById('input-importar');
        if (!input.files[0]) {
            mostrarMensagem('Selecione um arquivo', 'erro');
            return;
        }

        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (dados.clientes && Array.isArray(dados.clientes)) {
                    localStorage.setItem(DB_KEY, JSON.stringify(dados));
                    mostrarMensagem('✓ Dados importados!', 'sucesso');
                    document.getElementById('input-importar').value = '';
                    atualizarEstatisticas();
                    atualizarListaClientes();
                } else {
                    mostrarMensagem('✗ Formato inválido', 'erro');
                }
            } catch (erro) {
                mostrarMensagem('✗ Erro: ' + erro.message, 'erro');
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('btn-limpar').addEventListener('click', () => {
        if (confirm('⚠️ DELETAR TODOS OS DADOS? (USUÁRIOS E CLIENTES)')) {
            localStorage.setItem(DB_KEY, JSON.stringify({ clientes: [] }));
            localStorage.setItem(USERS_KEY, JSON.stringify({ usuarios: [] }));
            mostrarMensagem('✓ Todos os dados foram deletados. Faça logout e crie uma nova conta.', 'sucesso');
            
            setTimeout(() => {
                logout();
            }, 2000);
        }
    });

    document.getElementById('btn-salvar-usuario').addEventListener('click', () => {
        const usuarioId = document.getElementById('form-editar-usuario').dataset.usuarioId;
        const novoRole = document.getElementById('modal-usr-role').value;
        
        try {
            alterarRoleUsuario(usuarioId, novoRole);
            mostrarMensagem('✓ Permissão alterada!', 'sucesso');
            fecharModalUsuario();
            atualizarListaUsuarios();
        } catch (erro) {
            mostrarMensagem('✗ ' + erro.message, 'erro');
        }
    });

    document.getElementById('btn-excluir-usuario').addEventListener('click', () => {
        const usuarioId = document.getElementById('form-editar-usuario').dataset.usuarioId;

        if (!confirm('Tem certeza que deseja excluir este usuário?')) {
            return;
        }

        try {
            excluirUsuario(usuarioId);
            mostrarMensagem('✓ Usuário excluído com sucesso!', 'sucesso');
            fecharModalUsuario();
            atualizarListaUsuarios();
        } catch (erro) {
            mostrarMensagem('✗ ' + erro.message, 'erro');
        }
    });

    document.getElementById('form-novo-usuario').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('novo-usr-nome').value.trim();
        const email = document.getElementById('novo-usr-email').value.trim();
        const senha = document.getElementById('novo-usr-senha').value;
        const role = document.getElementById('novo-usr-role').value;
        const cpf = document.getElementById('novo-usr-cpf').value.trim();
        const dataNascimento = document.getElementById('novo-usr-data').value;
        
        if (!nome || !email || !senha) {
            mostrarMensagem('✗ Preencha Nome, Email e Senha', 'erro');
            return;
        }
        
        try {
            const resultado = criarContaAdmin(nome, email, cpf, dataNascimento, senha, role);
            if (resultado.sucesso) {
                mostrarMensagem('✓ Usuário criado com sucesso!', 'sucesso');
                mostrarToast('Membro criado com sucesso!');
                document.getElementById('form-novo-usuario').reset();
                atualizarListaUsuarios();
            } else {
                mostrarMensagem('✗ Erro: ' + resultado.erro, 'erro');
            }
        } catch (erro) {
            mostrarMensagem('✗ Erro ao criar usuário', 'erro');
        }
    });

    configurarEnterFormularios();
}

function inicializarBD() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify({ clientes: [] }));
    }
}

function obterClientes() {
    const dados = localStorage.getItem(DB_KEY);
    return JSON.parse(dados).clientes || [];
}

function salvarClientes(clientes) {
    const dados = JSON.parse(localStorage.getItem(DB_KEY));
    dados.clientes = clientes;
    localStorage.setItem(DB_KEY, JSON.stringify(dados));
    atualizarEstatisticas();
}

function obterMapaMensagensRapidas() {
    try {
        const dados = localStorage.getItem(WA_RAPIDAS_KEY);
        if (!dados) return {};
        const parsed = JSON.parse(dados);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (erro) {
        return {};
    }
}

function salvarMapaMensagensRapidas(mapa) {
    localStorage.setItem(WA_RAPIDAS_KEY, JSON.stringify(mapa));
}

function obterMensagensRapidasUsuario() {
    if (!usuarioLogado) return [];

    const mapa = obterMapaMensagensRapidas();
    const chaveUsuario = String(usuarioLogado.id);
    const mensagens = mapa[chaveUsuario];
    return Array.isArray(mensagens) ? mensagens : [];
}

function salvarMensagensRapidasUsuario(mensagens) {
    if (!usuarioLogado) return;

    const mapa = obterMapaMensagensRapidas();
    const chaveUsuario = String(usuarioLogado.id);
    mapa[chaveUsuario] = mensagens;
    salvarMapaMensagensRapidas(mapa);
}

function renderizarMensagensRapidasWhatsApp() {
    const cardsContainer = document.getElementById('wa-rapidas-cards');
    if (!cardsContainer) return;

    const mensagens = obterMensagensRapidasUsuario();

    if (mensagens.length === 0) {
        cardsContainer.innerHTML = '<div class="wa-rapida-card-empty">Nenhuma mensagem rápida salva</div>';
        return;
    }

    cardsContainer.innerHTML = mensagens.map(msg => `
        <div class="wa-rapida-card" data-id="${msg.id}" title="Clique para usar esta mensagem">
            <div class="wa-rapida-card-head">
                <span class="wa-rapida-card-title">${escapeHtml(msg.nome)}</span>
                <button type="button" class="wa-rapida-card-remove" data-id="${msg.id}" title="Remover mensagem">x</button>
            </div>
            <p class="wa-rapida-card-text">${escapeHtml(msg.texto)}</p>
        </div>
    `).join('');

    cardsContainer.querySelectorAll('.wa-rapida-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-id');
            aplicarMensagemRapidaPorId(id);
        });
    });

    cardsContainer.querySelectorAll('.wa-rapida-card-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            removerMensagemRapidaPorId(id);
        });
    });
}

function aplicarMensagemRapidaPorId(idMensagem) {
    const mensagens = obterMensagensRapidasUsuario();
    const mensagem = mensagens.find(msg => String(msg.id) === String(idMensagem));

    if (!mensagem) {
        mostrarMensagem('✗ Mensagem rápida não encontrada', 'erro');
        return;
    }

    document.getElementById('wa-mensagem').value = mensagem.texto;
    mostrarMensagem('✓ Mensagem rápida aplicada', 'sucesso');
}

function removerMensagemRapidaPorId(idMensagem) {
    const mensagens = obterMensagensRapidasUsuario();
    const mensagensAtualizadas = mensagens.filter(msg => String(msg.id) !== String(idMensagem));

    salvarMensagensRapidasUsuario(mensagensAtualizadas);
    renderizarMensagensRapidasWhatsApp();
    mostrarMensagem('✓ Mensagem rápida removida', 'sucesso');
}

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function adicionarCliente(dados) {
    const clientes = obterClientes();
    const cocomprador = dados.temCocomprador ? {
        nome: (dados.cocompradorNome || '').trim(),
        cpf: (dados.cocompradorCpf || '').trim(),
        profissao: (dados.cocompradorProfissao || '').trim(),
        renda: parseFloat(dados.cocompradorRenda) || 0
    } : null;

    const novoCliente = {
        id: Date.now(),
        nome: dados.nome.trim(),
        cpf: dados.cpf.trim(),
        profissao: dados.profissao.trim(),
        renda: parseFloat(dados.renda) || 0,
        dependentes: parseInt(dados.dependentes) || 0,
        regiao: dados.regiao.trim(),
        tipoImovel: dados.tipoImovel.trim(),
        entrada: parseFloat(dados.entrada) || 0,
        etapaFunil: 'novo',
        temCocomprador: dados.temCocomprador || false,
        cocomprador: cocomprador,
        criadoPor: usuarioLogado.id,
        dataAdicionado: new Date().toLocaleString('pt-BR'),
        anotacoes: dados.anotacoes ? [{
            data: new Date().toLocaleString('pt-BR'),
            texto: dados.anotacoes.trim(),
            nomeLead: dados.nome.trim(),
            nomeCocomprador: cocomprador && cocomprador.nome ? cocomprador.nome : ''
        }] : []
    };

    clientes.push(novoCliente);
    salvarClientes(clientes);
    return novoCliente;
}

function obterClientePorId(id) {
    const clientes = obterClientes();
    return clientes.find(c => c.id == id);
}

function atualizarCliente(id, dados) {
    let clientes = obterClientes();
    const index = clientes.findIndex(c => c.id == id);

    if (index !== -1) {
        clientes[index].nome = dados.nome.trim();
        clientes[index].cpf = dados.cpf.trim();
        clientes[index].profissao = dados.profissao.trim();
        clientes[index].renda = parseFloat(dados.renda) || 0;
        clientes[index].dependentes = parseInt(dados.dependentes) || 0;
        clientes[index].regiao = dados.regiao.trim();
        clientes[index].tipoImovel = dados.tipoImovel.trim();
        clientes[index].entrada = parseFloat(dados.entrada) || 0;
        clientes[index].etapaFunil = normalizarEtapaFunil(dados.etapaFunil);
        clientes[index].temCocomprador = !!dados.temCocomprador;

        if (!clientes[index].temCocomprador) {
            clientes[index].cocomprador = null;
        }

        if (dados.anotacao && dados.anotacao.trim()) {
            clientes[index].anotacoes.push({
                data: new Date().toLocaleString('pt-BR'),
                texto: dados.anotacao.trim(),
                nomeLead: clientes[index].nome,
                nomeCocomprador: clientes[index].cocomprador && clientes[index].cocomprador.nome ? clientes[index].cocomprador.nome : ''
            });
        }

        salvarClientes(clientes);
        return clientes[index];
    }
}

function atualizarCocomprador(id, dados) {
    let clientes = obterClientes();
    const index = clientes.findIndex(c => c.id == id);

    if (index !== -1) {
        clientes[index].temCocomprador = true;
        clientes[index].cocomprador = {
            nome: dados.nome.trim(),
            cpf: dados.cpf.trim(),
            profissao: dados.profissao.trim(),
            renda: parseFloat(dados.renda) || 0
        };

        clientes[index].anotacoes.push({
            data: new Date().toLocaleString('pt-BR'),
            texto: 'Dados do co-comprador atualizados.',
            nomeLead: clientes[index].nome,
            nomeCocomprador: clientes[index].cocomprador.nome || ''
        });

        salvarClientes(clientes);
        return clientes[index];
    }
}

function removerCocomprador(id) {
    let clientes = obterClientes();
    const index = clientes.findIndex(c => c.id == id);

    if (index !== -1) {
        const nomeCocompradorRemovido = clientes[index].cocomprador && clientes[index].cocomprador.nome
            ? clientes[index].cocomprador.nome
            : '';

        clientes[index].temCocomprador = false;
        clientes[index].cocomprador = null;

        clientes[index].anotacoes.push({
            data: new Date().toLocaleString('pt-BR'),
            texto: nomeCocompradorRemovido
                ? `Co-comprador removido: ${nomeCocompradorRemovido}.`
                : 'Co-comprador removido.',
            nomeLead: clientes[index].nome,
            nomeCocomprador: nomeCocompradorRemovido
        });

        salvarClientes(clientes);
        return clientes[index];
    }
}

function deletarCliente(id) {
    let clientes = obterClientes();
    clientes = clientes.filter(c => c.id != id);
    salvarClientes(clientes);
}

function atualizarListaClientes() {
    const clientes = obterClientes();
    const lista = document.getElementById('lista-clientes');
    const searchTerm = document.getElementById('search-cliente').value.toLowerCase();

    const clientesFiltrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm)
    );

    renderizarFunilLeads(clientesFiltrados);

    if (clientesFiltrados.length === 0) {
        lista.innerHTML = '<div class="vazio"><p>Nenhum lead encontrado</p></div>';
        return;
    }

    lista.innerHTML = clientesFiltrados.map(cliente => {
        const rendaTotal = cliente.renda + (cliente.cocomprador ? cliente.cocomprador.renda : 0);
        const ccIndicador = cliente.temCocomprador ? ' 👥' : '';
        const nomeCocomprador = cliente.cocomprador && cliente.cocomprador.nome
            ? cliente.cocomprador.nome
            : '';
        const etapa = normalizarEtapaFunil(cliente.etapaFunil);
        const etapaNome = nomeEtapaFunil(etapa);
        
        return `
        <div class="cliente-card" onclick="abrirClienteModal(${cliente.id})">
            <h3>${cliente.nome}${ccIndicador}</h3>
            <p><span class="label">CPF:</span> ${cliente.cpf || '-'}</p>
            <p><span class="label">Profissão:</span> ${cliente.profissao || '-'}</p>
            <p><span class="label">Renda:</span> R$ ${cliente.renda.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p><span class="label">Região:</span> ${cliente.regiao || '-'}</p>
            <p><span class="label">Imóvel:</span> ${cliente.tipoImovel || '-'}</p>
            <p><span class="label">Entrada:</span> R$ ${cliente.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <span class="etapa-badge ${etapa}">${etapaNome}</span>
            ${cliente.temCocomprador ? `<p><span class="label">Co-comprador:</span> ${nomeCocomprador || 'Ativado (dados pendentes)'}</p>` : ''}
            ${cliente.temCocomprador ? `<p style="color: #27ae60;"><strong>💡 Renda Total: R$ ${rendaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>` : ''}
            <div class="data">
                Adicionado: ${cliente.dataAdicionado}<br>
                Anotações: ${cliente.anotacoes.length}
            </div>
        </div>
    `}).join('');
}

function abrirClienteModal(id) {
    const cliente = obterClientePorId(id);
    if (!cliente) return;

    document.getElementById('modal-nome').value = cliente.nome;
    document.getElementById('modal-cpf').value = cliente.cpf;
    document.getElementById('modal-profissao').value = cliente.profissao;
    document.getElementById('modal-renda').value = cliente.renda;
    document.getElementById('modal-dependentes').value = cliente.dependentes;
    document.getElementById('modal-regiao').value = cliente.regiao;
    document.getElementById('modal-tipo-imovel').value = cliente.tipoImovel;
    document.getElementById('modal-entrada').value = cliente.entrada;
    document.getElementById('modal-etapa-funil').value = normalizarEtapaFunil(cliente.etapaFunil);
    document.getElementById('modal-tem-cocomprador').checked = cliente.temCocomprador;
    document.getElementById('modal-anotacao-nova').value = '';

    const btnTabCocomprador = document.getElementById('tab-cocomprador-btn');
    if (cliente.temCocomprador) {
        btnTabCocomprador.style.display = 'block';
        preencherCocomprador(cliente.cocomprador);
    } else {
        btnTabCocomprador.style.display = 'none';
        limparFormCocomprador();
    }

    const histContainer = document.getElementById('hist-anotacoes');
    if (cliente.anotacoes.length === 0) {
        histContainer.innerHTML = '<p style="color: #999;">Nenhuma anotação ainda</p>';
    } else {
        histContainer.innerHTML = [...cliente.anotacoes]
            .reverse()
            .map((anotacao, idx) => `
                <div class="anotacao-item ${idx === 0 ? 'ultima' : ''}">
                    <div class="data">${anotacao.data}</div>
                    <div class="texto"><strong>Lead:</strong> ${anotacao.nomeLead || cliente.nome}</div>
                    ${anotacao.nomeCocomprador ? `<div class="texto"><strong>Co-comprador:</strong> ${anotacao.nomeCocomprador}</div>` : ''}
                    <div class="texto">${anotacao.texto}</div>
                </div>
            `).join('');
    }

    document.getElementById('form-editar').dataset.clienteId = id;
    document.getElementById('form-cocomprador').dataset.clienteId = id;

    ativarTabModal('principal');
    document.getElementById('modal-cliente').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modal-cliente').style.display = 'none';
}

function ativarTabModal(tabName) {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.modal-tab-btn[data-modal-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function preencherCocomprador(cc) {
    if (!cc) return;
    document.getElementById('modal-cc-nome').value = cc.nome || '';
    document.getElementById('modal-cc-cpf').value = cc.cpf || '';
    document.getElementById('modal-cc-profissao').value = cc.profissao || '';
    document.getElementById('modal-cc-renda').value = cc.renda || 0;
    
    const rendaPrincipal = parseFloat(document.getElementById('modal-renda').value) || 0;
    const rendaTotalDisplay = (rendaPrincipal + (cc.renda || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('renda-total-display').textContent = `R$ ${rendaTotalDisplay}`;
}

function limparFormCocomprador() {
    document.getElementById('modal-cc-nome').value = '';
    document.getElementById('modal-cc-cpf').value = '';
    document.getElementById('modal-cc-profissao').value = '';
    document.getElementById('modal-cc-renda').value = 0;
}

function atualizarEstatisticas() {
    const clientes = obterClientes();
    document.getElementById('total-clientes').textContent = clientes.length;

    const agora = new Date();
    document.getElementById('ultima-atualizacao').textContent = agora.toLocaleString('pt-BR');
}

function mostrarMensagem(texto, tipo = 'sucesso') {
    const el = document.getElementById('mensagem-sucesso');
    el.textContent = texto;
    el.className = `mensagem ${tipo}`;

    setTimeout(() => {
        el.className = 'mensagem';
    }, 4000);
}

function mostrarToast(texto) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.textContent = `✓ ${texto}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 220);
    }, 2600);
}

function normalizarEtapaFunil(etapa) {
    const etapaValida = ETAPAS_FUNIL.some(item => item.id === etapa);
    return etapaValida ? etapa : 'tratativa';
}

function nomeEtapaFunil(etapa) {
    const encontrado = ETAPAS_FUNIL.find(item => item.id === etapa);
    return encontrado ? encontrado.nome : 'Em Tratativa';
}

function renderizarFunilLeads(clientes) {
    const funilEl = document.getElementById('funil-leads');
    if (!funilEl) return;

    funilEl.innerHTML = ETAPAS_FUNIL.map(etapa => {
        const leadsEtapa = clientes.filter(cliente => normalizarEtapaFunil(cliente.etapaFunil) === etapa.id);

        return `
            <div class="funil-coluna">
                <div class="funil-coluna-head">
                    <span>${etapa.nome}</span>
                    <span class="funil-coluna-count">${leadsEtapa.length}</span>
                </div>
                <div class="funil-cards">
                    ${leadsEtapa.length > 0 ? leadsEtapa.map(cliente => {
                        const rendaTotal = cliente.renda + (cliente.cocomprador ? cliente.cocomprador.renda : 0);
                        return `
                            <div class="funil-card" onclick="abrirClienteModal(${cliente.id})">
                                <h4>${cliente.nome}</h4>
                                <p>Renda total: R$ ${rendaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            </div>
                        `;
                    }).join('') : '<p class="vazio">Sem leads</p>'}
                </div>
            </div>
        `;
    }).join('');
}

function atualizarListaUsuarios() {
    const usuarios = obterUsuarios();
    const lista = document.getElementById('lista-usuarios');
    
    document.getElementById('total-usuarios').textContent = usuarios.length;

    if (usuarios.length === 0) {
        lista.innerHTML = '<div class="vazio"><p>Nenhum usuário</p></div>';
        return;
    }

    lista.innerHTML = usuarios.map(usuario => `
        <div class="usuario-card">
            <h3>${usuario.nome}</h3>
            <p><span class="label">Email:</span> ${usuario.email}</p>
            <p><span class="label">CPF:</span> ${usuario.cpf || '-'}</p>
            <p><span class="label">Permissão:</span> <span class="role-badge ${usuario.role}">${usuario.role === 'admin' ? 'Administrador' : 'Corretor'}</span></p>
            <p><span class="label">Cadastrado:</span> ${usuario.dataCriacao}</p>
            <div class="usuario-actions">
                <button class="btn btn-secondary" onclick="abrirUsuarioModal(${usuario.id})">✏️ Editar Permissão</button>
            </div>
        </div>
    `).join('');
}

function abrirUsuarioModal(usuarioId) {
    const usuario = obterUsuarios().find(u => u.id === usuarioId);
    if (!usuario) return;

    document.getElementById('modal-usr-nome').value = usuario.nome;
    document.getElementById('modal-usr-email').value = usuario.email;
    document.getElementById('modal-usr-role').value = usuario.role;
    document.getElementById('form-editar-usuario').dataset.usuarioId = usuarioId;

    const btnExcluirUsuario = document.getElementById('btn-excluir-usuario');
    const ehUsuarioLogado = usuarioLogado && usuario.id === usuarioLogado.id;
    btnExcluirUsuario.disabled = ehUsuarioLogado;
    btnExcluirUsuario.title = ehUsuarioLogado ? 'Você não pode excluir seu próprio usuário logado.' : '';
    
    document.getElementById('modal-usuario').style.display = 'block';
}

function fecharModalUsuario() {
    document.getElementById('modal-usuario').style.display = 'none';
}

function alterarRoleUsuario(usuarioId, novoRole) {
    let usuarios = obterUsuarios();
    const index = usuarios.findIndex(u => u.id == usuarioId);

    if (index === -1) {
        throw new Error('Usuário não encontrado.');
    }

    const usuarioAlvo = usuarios[index];
    const admins = usuarios.filter(u => u.role === 'admin');

    if (usuarioAlvo.role === 'admin' && novoRole !== 'admin' && admins.length <= 1) {
        throw new Error('Não é possível remover a permissão do último administrador.');
    }

    usuarioAlvo.role = novoRole;
    salvarUsuarios(usuarios);
}

function excluirUsuario(usuarioId) {
    let usuarios = obterUsuarios();
    const index = usuarios.findIndex(u => u.id == usuarioId);

    if (index === -1) {
        throw new Error('Usuário não encontrado.');
    }

    const usuarioAlvo = usuarios[index];
    const ehUsuarioLogado = usuarioLogado && usuarioAlvo.id === usuarioLogado.id;
    if (ehUsuarioLogado) {
        throw new Error('Você não pode excluir o usuário que está logado.');
    }

    const admins = usuarios.filter(u => u.role === 'admin');
    if (usuarioAlvo.role === 'admin' && admins.length <= 1) {
        throw new Error('Não é possível excluir o último administrador.');
    }

    usuarios = usuarios.filter(u => u.id !== usuarioAlvo.id);
    salvarUsuarios(usuarios);
}

function configurarEnterFormularios() {
    const formsToConfig = [
        { form: document.getElementById('form-cliente'), submitBtn: null },
        { form: document.getElementById('form-editar'), submitBtn: document.getElementById('btn-salvar') },
        { form: document.getElementById('form-cocomprador'), submitBtn: document.getElementById('btn-salvar-cocomprador') }
    ];

    formsToConfig.forEach(({ form, submitBtn }) => {
        if (!form) return;
        const campos = form.querySelectorAll('input, select, textarea');
        
        campos.forEach((campo, index) => {
            campo.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index < campos.length - 1) {
                        campos[index + 1].focus();
                    } else if (submitBtn) {
                        submitBtn.click();
                    } else if (form.id === 'form-cliente') {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    });
}
