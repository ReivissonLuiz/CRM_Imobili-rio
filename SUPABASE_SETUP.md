# Setup da Função RPC para Criar Usuários

## Passo 1: Abra o SQL Editor do Supabase
1. Vá para https://supabase.com
2. Entre em seu projeto
3. Clique em **SQL Editor** no menu esquerdo
4. Clique em **New query**

## Passo 2: Execute este SQL para criar a função

Copie e cole todo o código abaixo no SQL Editor:

```sql
-- Função RPC para criar usuário (apenas para admin)
CREATE OR REPLACE FUNCTION public.criar_usuario_novo(
  p_email TEXT,
  p_senha TEXT,
  p_nome TEXT,
  p_role TEXT DEFAULT 'corretor',
  p_cpf TEXT DEFAULT NULL,
  p_data_nascimento TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_response JSON;
BEGIN
  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_senha, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- Criar perfil na tabela profiles
  INSERT INTO public.profiles (
    id,
    nome,
    role,
    cpf,
    data_nascimento,
    criado_em
  ) VALUES (
    v_user_id,
    p_nome,
    p_role,
    p_cpf,
    CASE WHEN p_data_nascimento = '' OR p_data_nascimento IS NULL 
         THEN NULL 
         ELSE p_data_nascimento::DATE 
    END,
    NOW()
  );

  v_response := json_build_object(
    'sucesso', true,
    'user_id', v_user_id,
    'email', p_email,
    'nome', p_nome,
    'role', p_role
  );

  RETURN v_response;

EXCEPTION WHEN OTHERS THEN
  v_response := json_build_object(
    'sucesso', false,
    'erro', SQLERRM
  );
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.criar_usuario_novo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
```

## Passo 3: Clique em "Run" e espere a confirmação

Se aparecer `Success` (ou sem erro), está pronto!

---

**Pronto!** Agora o CRM pode criar usuários automaticamente.
