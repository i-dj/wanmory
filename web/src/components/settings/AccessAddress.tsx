import { type FormEvent, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogFooter, DialogError, dialogInputClass } from '@/components/ui/Modal'
import type { NetStatus } from '@/lib/api'
import { cx } from '@/lib/cx'
import { t } from '@/i18n'
import { tx } from '@/i18n/rich'

// 「访问域名」这一块：卡片底下两行网址（用域名打开、用 IP 打开），「修改」弹出的窗口是 http:// [域名] :8080。
// 域名在这里改、保存后几秒内生效；端口改不了（Docker 里由 docker-compose 的端口映射定，相册程序自己换不了），
// 窗口里一句话写明去哪改：安装目录里 .env 的 WANMORY_PORT，改完重启服务

// AccessLinks 是卡片底下的两行：域名访问、IP 访问
export function AccessLinks({ net, saved }: { net: NetStatus | null; saved: string }) {
  if (!net) return <span className="font-mono text-body">{saved}</span>
  // 以前存的域名不是 .local 结尾（那时还允许），服务器没用它
  if (net.domain !== saved)
    return (
      <span className="block text-caption text-danger">
        {t('「{saved}」不是 .local 结尾，现在用的是 {domain}，请修改或恢复默认', { saved, domain: net.domain })}
      </span>
    )
  const ipUrl = net.ip_url || browserIpUrl()
  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5">
      <dt className="text-caption text-muted">{t('域名访问')}</dt>
      <dd>
        <Link href={net.url} />
      </dd>
      <dt className="text-caption text-muted">{t('IP 访问')}</dt>
      <dd>
        {ipUrl ? (
          <Link href={ipUrl} />
        ) : (
          <span className="text-caption text-muted">{t('还不知道这台机器的局域网 IP，过一会儿刷新再看')}</span>
        )}
      </dd>
    </dl>
  )
}

function Link({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-body break-all text-accent hover:underline"
    >
      {href}
    </a>
  )
}

// browserIpUrl：服务器还不知道局域网 IP（Docker 里 mdns 服务还没报上来）时，现在就是用 IP 打开的，就用地址栏里的
function browserIpUrl(): string {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(location.hostname) ? location.origin : ''
}

// AccessAddressDialog：http:// [域名] :8080。只有域名能改；端口写在后面不能改，下面一句话说清楚去哪改
export function AccessAddressDialog({
  value,
  net,
  onCancel,
  onConfirm,
}: {
  value: string
  net: NetStatus | null
  onCancel: () => void
  onConfirm: (domain: string) => Promise<void>
}) {
  const port = net?.port || location.port || '80'
  const [domain, setDomain] = useState(value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const domainChanged = domain.trim() !== value

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!domainChanged) return onCancel()
    setBusy(true)
    setError('')
    try {
      await onConfirm(domain.trim())
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={t('访问地址')} onClose={onCancel}>
      <form onSubmit={submit} noValidate>
        {/* http:// [域名] :8080 */}
        <div className="flex items-center gap-2 font-mono text-body">
          <span className="shrink-0 text-muted">http://</span>
          <input
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value)
              setError('')
            }}
            aria-label={t('域名')}
            placeholder="wanmory.local"
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            className={cx(dialogInputClass.replace('w-full', ''), 'min-w-0 flex-1 font-mono')}
          />
          {port !== '80' && <span className="shrink-0 text-muted">:{port}</span>}
        </div>
        <p className="mt-2 text-caption text-muted">{t('域名必须以 .local 结尾，保存后几秒内生效。')}</p>
        <p className="mt-3 text-caption text-muted">
          {net?.docker === false
            ? tx('修改端口：请修改启动相册程序时的环境变量 {env}（例如 :9000），然后重启相册程序。', {
                env: <code className="font-mono text-fg">WANMORY_ADDR</code>,
              })
            : (() => {
                // 两句各自写全（不要先选好句子再传给 tx）：翻译检查脚本只认 tx('…') 里直接写的原文
                const parts = {
                  dir: <code className="font-mono text-fg">{net?.install_dir}</code>,
                  file: <code className="font-mono text-fg">.env</code>,
                  field: <code className="font-mono text-fg">WANMORY_PORT</code>,
                }
                return net?.install_dir
                  ? tx('修改端口：请修改安装目录 {dir} 里配置文件 {file} 的 {field}，然后重启服务（在安装目录运行 docker compose up -d）。', parts)
                  : tx('修改端口：请修改安装目录里配置文件 {file} 的 {field}，然后重启服务（在安装目录运行 docker compose up -d）。', parts)
              })()}
        </p>

        <DialogError>{error}</DialogError>
        <DialogFooter>
          <DialogButton onClick={onCancel}>{t('取消')}</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy || !domain.trim() || !domainChanged}>
            {t('保存')}
          </DialogButton>
        </DialogFooter>
      </form>
    </Modal>
  )
}
