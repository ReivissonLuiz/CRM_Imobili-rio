# 📋 Gerenciador de Leads Imobiliários - Guia de Uso

## Descrição
Aplicação web para gerenciar leads imobiliários com composição de renda (co-compradores) e histórico de anotações. Todos os dados são armazenados localmente no seu navegador em um banco de dados txt/JSON.

## 📁 Arquivos do Projeto
- **index.html** - Interface principal da aplicação
- **styles.css** - Estilo visual (responsivo para desktop e mobile)
- **script.js** - Lógica da aplicação com gerenciamento de dados
- **clientes_db.json** - Banco de dados (criado automaticamente)

## 🚀 Como Usar

### 1️⃣ Abrir a Aplicação
Simplesmente abra o arquivo `index.html` no seu navegador (Firefox, Chrome, Edge, etc).

### 2️⃣ Adicionar um Lead

1. Vá para a aba **"Adicionar Cliente"** (aqui chamado de "Novo Lead Imobiliário")
2. Preencha os dados do lead principal:
   - **Nome*** (obrigatório)
   - **CPF**
   - **Profissão**
   - **Renda Mensal** (em R$)
   - **Quantidade de Dependentes**
   - **Região de Interesse*** (obrigatório)
   - **Tipo de Imóvel*** (Apartamento, Casa, Sobrado, Terreno, Comercial, Outro)
   - **Entrada Disponível** (em R$)
   - **Anotações Iniciais** (opcional)

3. ✅ **Marque o checkbox "Adicionar co-comprador para composição de renda"** se o lead tiver comprador adicional
4. Clique em **"Adicionar Lead"**

### 3️⃣ Visualizar e Gerenciar Leads

1. Vá para a aba **"Listar Clientes"**
2. Veja todos seus leads em cards
3. **Buscar**: Use o campo de busca para filtrar por nome
4. **Ícone 👥**: Indica lead com co-comprador
5. **Clicar no lead**: Abre um modal para editar dados e anotações

### 4️⃣ Adicionar Co-Comprador para Composição de Renda

Ao clicar em um lead, no modal:

1. **Aba "Lead Principal"**: Marque o checkbox "Possui co-comprador"
2. Uma nova aba **"Co-Comprador"** aparecerá
3. Preencha os dados do co-comprador:
   - **Nome***
   - **CPF**
   - **Profissão**
   - **Renda Mensal**
   - **Quantidade de Dependentes**
   - **Região de Interesse**

4. A **Renda Total para Financiamento** é calculada automaticamente
5. Clique em **"Salvar Co-Comprador"**

### 5️⃣ Editar Lead e Adicionar Anotações

Ao clicar em um lead:
1. Edite qualquer informação pessoal
2. Veja o histórico de todas as anotações anteriores
3. Adicione uma nova anotação na caixa de texto
4. Clique em **"Salvar Alterações"**

### 6️⃣ Remover Co-Comprador

Na aba "Co-Comprador" do modal:
1. Clique em **"Remover Co-Comprador"**
2. Confirme a ação

### 7️⃣ Deletar Lead

No modal de edição:
1. Clique em **"Deletar Lead"**
2. Confirme a ação (não pode ser desfeita)

### 8️⃣ Backup e Exportação

Vá para a aba **"Backup/Dados"** para:

#### Exportar Dados
- **Baixar Dados (JSON)**: Exporta em formato JSON para importar depois
- **Baixar Dados (TXT)**: Exporta em formato texto legível

#### Importar Dados
1. Clique em **"Escolher arquivo"**
2. Selecione um arquivo JSON previamente exportado
3. Clique em **"Importar Dados"**

#### Limpeza
- **Limpar Todos os Dados**: Deleta permanentemente todos os leads

#### Estatísticas
- Total de leads
- Última atualização

## 💾 Onde os Dados Ficam?

Os dados são armazenados no **localStorage do navegador**, que significa:
- ✅ Persiste entre aberturas do site
- ✅ Sem necessidade de servidor
- ✅ Rápido e seguro localmente
- ⚠️ Limpar cache/dados do navegador irá deletar os dados

## 🔒 Segurança

- Os dados só existem no seu computador
- Não há envio de dados para internet
- Você pode fazer backup a qualquer hora

## 📱 Responsivo

A aplicação funciona em:
- Desktop (computador)
- Tablet
- Smartphone

## 🛠️ Recursos

✅ Adicionar, editar e deletar leads  
✅ **Co-comprador com composição de renda automática**  
✅ **Cálculo automático de renda total para financiamento**  
✅ Histórico de anotações com data e hora  
✅ Busca por nome em tempo real  
✅ Exportar dados em JSON ou TXT  
✅ Importar dados de backup  
✅ Interface bonita e fácil de usar  
✅ Design responsivo  
✅ Sem necessidade de conexão com internet  

## 📊 Campos do Lead

### Lead Principal
- Nome (obrigatório)
- CPF
- Profissão
- Renda Mensal
- Dependentes
- Região de Interesse (obrigatório)
- Tipo de Imóvel (obrigatório)
- Entrada Disponível
- Anotações

### Co-Comprador (Opcional)
- Nome
- CPF
- Profissão
- Renda Mensal
- Dependentes
- Região de Interesse

## ⚠️ Dicas Importantes

1. **Fazer backup regularmente**: Use a função de exportação
2. **Nome e Região obrigatórios**: Esses campos devem ser preenchidos
3. **Anotações**: Cada nova anotação fica registrada com data/hora
4. **Busca**: Funciona em tempo real enquanto digita
5. **Mobile**: A aplicação funciona perfeitamente em celulares
6. **Renda Total**: Calculada automaticamente ao adicionar co-comprador

## 🐛 Troubleshooting

**P: Perdi meus dados**
R: Se limpou o cache do navegador, os dados serão perdidos. Use a função de exportação regularmente!

**P: Como fazer backup**
R: Aba "Backup/Dados" → "Baixar Dados (JSON)" para ter um arquivo de backup

**P: Posso abrir em qualquer navegador?**
R: Sim! Chrome, Firefox, Edge, Safari - qualquer navegador moderno

**P: Posso compartilhar meus dados?**
R: Sim! Exporte como JSON e compartilhe com outras pessoas para importarem

**P: Como funciona o cálculo de renda total?**
R: A renda total = renda do lead principal + renda do co-comprador (se houver)

---

**Versão**: 2.0  
**Última atualização**: 2024  
**Funcionalidade**: Sistema de Leads Imobiliários com Composição de Renda
