# HANDOFF PACKET — latest transfer snapshot

## [2026-04-01 19:35 Europe/Oslo] Claude

### Current objective
Resolve LTX T2V silent failure + establish clean repo as verified source of truth.

### Completed this session
1. **LTX T2V fix** — `update_logic.ps1` now force-updates `ComfyUI-LTXVideo`, `RES4LYF`, `ComfyUI-KJNodes` on every `update.bat` (bypasses weekly throttle). Both repos identical. **VERIFIED**
2. **Repo sync** — Clean repo and install repo are now content-identical (CRLF/LF difference resolved by WIP backup commit). **VERIFIED**
3. **WIP backup committed** — `16ed738` includes all Codex unstaged changes + docs + sync. **VERIFIED**
4. **Frontend build passes** — 1940 modules, no TS errors. **VERIFIED**
5. **Backend syntax clean** — `lora_service.py`, `social_service.py`. **VERIFIED**
6. **Log files created** — AGENT_COLLAB_LOG, ADMIN_CHANGELOG, HANDOFF_PACKET. **VERIFIED**

### In progress / open
- LTX T2V runtime fix: user must run `update.bat` → `run.bat`. **PENDING VALIDATION**
- LipsyncTab `steps=4` — was reverted by user/linter. Leave as-is unless user confirms it should be 14. **ASSUMPTION: intentional**
- UI menu review (user's main request): not yet started

### Blockers
None.

### Git state
- Repo: `H:\Final\060326\comfyuifeddafrontclean`
- HEAD: `16ed738` — WIP backup before install->clean sync
- Branch ahead of origin/main by 1 commit (do not push until user says "push nå")
- Working tree: clean

### Exact next step for next agent
Start menu-by-menu UI review. Suggested order:
1. Settings → LoRA Models tab (Codex's new tab — needs review for UX/bugs)
2. Settings → ComfyUI Models (new groups added: LTX 2.3, FLUX2KLEIN, etc. — verify labels)
3. Video → Text to Video (LTX T2V, needs user validation post-update.bat)
4. Video → LTX I2V, Lipsync, WAN tabs
5. Z-Image, HQ Image, Img2Img, Inpaint, Mood Edit tabs
