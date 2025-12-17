# GitHub Push Guide

## Preparazione Pre-Push

### 1. Pulizia Cartella (nella tua cartella scaricata)

```bash
# Elimina cartella .manus (non serve per VPS)
rm -rf .manus

# Verifica che .gitignore esista
cat .gitignore
```

### 2. Inizializza Git Repository

```bash
cd /path/to/bitchange-pro  # Vai nella cartella scaricata

# Inizializza repository
git init

# Aggiungi tutti i file
git add .

# Verifica cosa verrà committato (esclude .env, node_modules, etc.)
git status

# Primo commit
git commit -m "Initial commit: BitChange Pro - Complete crypto exchange platform"
```

### 3. Crea Repository su GitHub

1. Vai su https://github.com
2. Click su "New repository" (bottone verde)
3. Nome repository: `bitchange-pro` (o quello che preferisci)
4. **IMPORTANTE**: NON inizializzare con README, .gitignore, o license (abbiamo già tutto)
5. Click "Create repository"

### 4. Collega e Pusha

Dopo aver creato il repo su GitHub, copia i comandi che ti mostra GitHub (simili a questi):

```bash
# Aggiungi remote origin (SOSTITUISCI con il tuo URL)
git remote add origin https://github.com/TUO_USERNAME/bitchange-pro.git

# Rinomina branch principale a main (se necessario)
git branch -M main

# Push iniziale
git push -u origin main
```

### 5. Verifica Push

Vai su GitHub e verifica che tutti i file siano stati caricati correttamente.

---

## File da Verificare PRIMA del Push

✅ **Questi file DEVONO essere presenti:**
- `package.json`
- `docker-compose.yml`
- `Dockerfile`
- `nginx.conf`
- `deploy.sh`
- `.env.production.example`
- `DEPLOYMENT.md`
- `QUICK_START.md`
- Tutte le cartelle: `client/`, `server/`, `drizzle/`, `scripts/`

❌ **Questi file NON devono essere pushati (già in .gitignore):**
- `.env` (contiene secrets)
- `node_modules/` (troppo grande)
- `.manus/` (interno Manus)
- `dist/` o `build/` (generati)

---

## Comandi Utili

```bash
# Vedere cosa verrà committato
git status

# Vedere cosa è ignorato
git status --ignored

# Rimuovere file già tracciato ma ora in .gitignore
git rm --cached <file>

# Vedere dimensione repository
du -sh .git

# Vedere ultimo commit
git log -1
```

---

## Troubleshooting

### "File troppo grande"
Se GitHub rifiuta file > 100MB:
```bash
# Trova file grandi
find . -type f -size +50M

# Aggiungili a .gitignore
echo "path/to/large/file" >> .gitignore
git rm --cached path/to/large/file
```

### "Repository già esistente"
Se hai già inizializzato git:
```bash
# Rimuovi git esistente
rm -rf .git

# Ricomincia da punto 2
```

### "Credenziali richieste"
GitHub richiede Personal Access Token invece di password:
1. Vai su GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Seleziona scope: `repo` (full control)
4. Copia il token
5. Usalo come password quando git chiede credenziali

---

## Dopo il Push

Una volta pushato su GitHub, puoi clonare sul VPS:

```bash
# Sul VPS
git clone https://github.com/TUO_USERNAME/bitchange-pro.git
cd bitchange-pro

# Segui DEPLOYMENT.md per il setup
```
