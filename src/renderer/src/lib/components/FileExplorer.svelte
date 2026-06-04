<script lang="ts">
  import {
    ArrowUp,
    ChevronRight,
    File,
    FilePlus,
    Folder,
    FolderPlus,
    Home,
    RefreshCw,
    Save,
    Trash2,
    Upload
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { cn } from '$lib/utils'
  import { filesApi, type FileEntry } from '../files'

  let {
    mode,
    root,
    mobilePlatform,
    deviceId,
    packageId
  }: {
    mode: 'local' | 'mobile'
    root: string
    mobilePlatform?: 'android' | 'harmony'
    deviceId?: string
    packageId?: string
  } = $props()

  let cwd = $state('')
  let entries = $state<FileEntry[]>([])
  let dataRoot = $state('')
  let loading = $state(false)
  let error = $state<string | null>(null)
  let selectedPath = $state('')
  let editorContent = $state('')
  let editorBinary = $state(false)
  let editorDirty = $state(false)
  let newName = $state('')

  const breadcrumbs = $derived(cwd ? cwd.split(/[/\\]/).filter(Boolean) : [])

  async function loadDir(path = cwd): Promise<void> {
    loading = true
    error = null
    try {
      if (mode === 'local') {
        entries = await filesApi.listLocal(root, path)
      } else if (mobilePlatform && deviceId && packageId) {
        const res = await filesApi.listMobile(mobilePlatform, deviceId, packageId, path)
        dataRoot = res.root
        entries = res.entries
      } else {
        entries = []
      }
      cwd = path
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      entries = []
    } finally {
      loading = false
    }
  }

  async function openEntry(ent: FileEntry): Promise<void> {
    if (ent.isDirectory) {
      const next = cwd ? `${cwd}/${ent.name}` : ent.name
      await loadDir(next)
      selectedPath = ''
      editorContent = ''
      editorDirty = false
      return
    }

    selectedPath = cwd ? `${cwd}/${ent.name}` : ent.name
    try {
      if (mode === 'local') {
        const r = await filesApi.readLocal(root, selectedPath)
        editorContent = r.text
        editorBinary = r.binary
      } else if (mobilePlatform && deviceId && packageId) {
        const r = await filesApi.readMobile(mobilePlatform, deviceId, packageId, selectedPath)
        editorContent = r.binary
          ? `[二进制 base64，前 2000 字符]\n${r.text.slice(0, 2000)}`
          : r.text
        editorBinary = r.binary
      }
      editorDirty = false
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function goUp(): Promise<void> {
    if (!cwd) return
    const parts = cwd.split(/[/\\]/).filter(Boolean)
    parts.pop()
    await loadDir(parts.join('/'))
  }

  async function goRoot(): Promise<void> {
    await loadDir('')
  }

  async function saveFile(): Promise<void> {
    if (!selectedPath) return
    try {
      if (mode === 'local') {
        await filesApi.writeLocal(root, selectedPath, editorContent, editorBinary)
      } else if (mobilePlatform && deviceId && packageId) {
        await filesApi.writeMobile(
          mobilePlatform,
          deviceId,
          packageId,
          selectedPath,
          editorContent,
          editorBinary
        )
      }
      editorDirty = false
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function deleteSelected(): Promise<void> {
    const rel = selectedPath || cwd
    if (!rel && !cwd) return
    if (!confirm(`确定删除「${rel || '当前目录'}」？`)) return
    try {
      if (mode === 'local') {
        await filesApi.deleteLocal(root, rel)
      } else if (mobilePlatform && deviceId && packageId) {
        await filesApi.deleteMobile(mobilePlatform, deviceId, packageId, rel)
      }
      selectedPath = ''
      editorContent = ''
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function createFolder(): Promise<void> {
    const name = newName.trim()
    if (!name) return
    const rel = cwd ? `${cwd}/${name}` : name
    try {
      if (mode === 'local') await filesApi.mkdirLocal(root, rel)
      else if (mobilePlatform && deviceId && packageId) {
        await filesApi.mkdirMobile(mobilePlatform, deviceId, packageId, rel)
      }
      newName = ''
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function createFile(): Promise<void> {
    const name = newName.trim()
    if (!name) return
    const rel = cwd ? `${cwd}/${name}` : name
    try {
      if (mode === 'local') await filesApi.writeLocal(root, rel, '', false)
      else if (mobilePlatform && deviceId && packageId) {
        await filesApi.writeMobile(mobilePlatform, deviceId, packageId, rel, '', false)
      }
      newName = ''
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function uploadFromPc(): Promise<void> {
    const picked = await filesApi.pickLocalFile()
    if (!picked) return
    const rel = cwd ? `${cwd}/${picked.name}` : picked.name
    try {
      if (mode === 'local') {
        await filesApi.writeLocal(root, rel, picked.content, picked.binary)
      } else if (mobilePlatform && deviceId && packageId) {
        await filesApi.writeMobile(
          mobilePlatform,
          deviceId,
          packageId,
          rel,
          picked.content,
          picked.binary
        )
      }
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  $effect(() => {
    void root
    void mode
    void mobilePlatform
    void deviceId
    void packageId
    cwd = ''
    selectedPath = ''
    editorContent = ''
    void loadDir('')
  })
</script>

<div class="flex min-h-[280px] flex-col overflow-hidden rounded-lg border border-border bg-card">
  <div class="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/30 px-2 py-2">
    <Button variant="ghost" size="icon-sm" onclick={goRoot} disabled={!cwd} title="根目录" aria-label="根目录">
      <Home class="size-4" />
    </Button>
    <Button variant="ghost" size="icon-sm" onclick={goUp} disabled={!cwd} title="上级" aria-label="上级">
      <ArrowUp class="size-4" />
    </Button>
    <Button variant="ghost" size="icon-sm" onclick={() => loadDir(cwd)} disabled={loading} title="刷新" aria-label="刷新">
      <RefreshCw class={cn('size-4', loading && 'animate-spin')} />
    </Button>
    <Button variant="ghost" size="icon-sm" onclick={uploadFromPc} title="从本机上传" aria-label="从本机上传">
      <Upload class="size-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon-sm"
      class="text-destructive hover:bg-destructive/10"
      onclick={deleteSelected}
      disabled={!selectedPath && !cwd}
      title="删除"
      aria-label="删除"
    >
      <Trash2 class="size-4" />
    </Button>
    <div class="flex min-w-0 flex-1 items-center gap-0.5 truncate px-1 font-mono text-[11px] text-muted-foreground">
      {#if mode === 'mobile' && dataRoot}
        <span class="truncate" title={dataRoot}>{dataRoot}</span>
      {:else if mode === 'local'}
        <span class="truncate" title={root}>{root}</span>
      {/if}
      {#each breadcrumbs as part, i (i)}
        <ChevronRight class="size-3 shrink-0 opacity-50" />
        <span class="truncate">{part}</span>
      {/each}
    </div>
  </div>

  {#if error}
    <p class="border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
  {/if}

  <div class="grid min-h-[220px] flex-1 grid-cols-1 md:grid-cols-2">
    <div class="flex min-h-0 flex-col border-border md:border-r">
      <div class="flex flex-wrap gap-1 border-b border-border p-2">
        <Input bind:value={newName} placeholder="新建名称" class="min-w-[100px] flex-1 text-xs" />
        <Button variant="outline" size="sm" onclick={createFile}>
          <FilePlus class="size-3" /> 文件
        </Button>
        <Button variant="outline" size="sm" onclick={createFolder}>
          <FolderPlus class="size-3" /> 文件夹
        </Button>
      </div>
      <ul class="flex-1 overflow-auto p-1">
        {#if loading}
          <li class="px-3 py-6 text-center text-xs text-muted-foreground">加载中…</li>
        {:else if entries.length === 0}
          <li class="px-3 py-6 text-center text-xs text-muted-foreground">空目录</li>
        {:else}
          {#each entries as ent (ent.path)}
            <li>
              <button
                type="button"
                class={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                  selectedPath === ent.path
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
                onclick={() => openEntry(ent)}
              >
                {#if ent.isDirectory}
                  <Folder class="size-4 shrink-0 text-primary" strokeWidth={1.75} />
                {:else}
                  <File class="size-4 shrink-0 opacity-60" strokeWidth={1.75} />
                {/if}
                <span class="min-w-0 flex-1 truncate">{ent.name}</span>
                {#if ent.size != null && !ent.isDirectory}
                  <span class="shrink-0 font-mono text-[10px] opacity-60">{ent.size} B</span>
                {/if}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>

    <div class="flex min-h-0 flex-col">
      {#if selectedPath}
        <div class="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <span class="min-w-0 truncate font-mono text-xs text-muted-foreground">{selectedPath}</span>
          <Button size="sm" onclick={saveFile}>
            <Save class="size-3" />
            保存
          </Button>
        </div>
        <textarea
          bind:value={editorContent}
          oninput={() => (editorDirty = true)}
          readonly={editorBinary}
          class="min-h-[180px] flex-1 resize-y border-0 bg-muted/20 p-3 font-mono text-xs focus:outline-none"
          placeholder="选择文件以编辑"
        ></textarea>
      {:else}
        <p class="flex flex-1 items-center justify-center p-6 text-xs text-muted-foreground">选择文件查看或编辑</p>
      {/if}
    </div>
  </div>
</div>
