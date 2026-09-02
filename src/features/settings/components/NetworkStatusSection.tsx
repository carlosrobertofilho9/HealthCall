import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Network, RefreshCw, Server, Wifi } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { SettingsGroup } from './SettingsGroup';

type NetworkAddress = {
  interface: string;
  address: string;
};

type NetworkInfo = {
  hostname: string;
  addresses: NetworkAddress[];
};

function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked on plain HTTP in older browsers.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`${label}: ${value}`}
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? 'Copiado' : label}
    </button>
  );
}

function buildLanUrl(address: string): string {
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${address}${port}`;
}

export function NetworkStatusSection() {
  const [info, setInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<NetworkInfo>('/api/system/network');
      setInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível identificar a rede local.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const currentHost = typeof window === 'undefined' ? '' : window.location.hostname;
  const currentIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(currentHost) ? currentHost : null;

  const lanAddresses = useMemo(
    () => (info?.addresses || []).map((item) => ({ ...item, url: buildLanUrl(item.address) })),
    [info],
  );

  return (
    <SettingsGroup
      title="Rede local"
      description="Veja onde o servidor HealthCall está rodando e quais endereços podem ser usados por outros dispositivos da mesma rede."
      className="mx-auto w-full max-w-3xl bg-linear-to-br from-card/80 to-card/40 shadow-2xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Server className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Servidor</p>
              <p className="truncate text-base font-extrabold text-foreground">
                {info?.hostname || (loading ? 'Identificando…' : 'HealthCall local')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition hover:bg-secondary disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Network className="size-4 text-primary" />
                Acesso atual
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
                <code className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                  {currentOrigin || 'Carregando…'}
                </code>
                {currentOrigin && <CopyButton value={currentOrigin} />}
              </div>
              <p className="px-1 text-xs text-muted-foreground">
                {currentIp ? (
                  <>Este dispositivo abriu o HealthCall pelo IP <span className="font-bold text-foreground">{currentIp}</span>.</>
                ) : (
                  <>Este acesso está usando <span className="font-bold text-foreground">{currentHost || 'localhost'}</span>. Para outros dispositivos, use um dos IPs abaixo.</>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Wifi className="size-4 text-emerald-600" />
                IPs para acessar pela rede local
              </div>

              {loading ? (
                <div className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Procurando interfaces de rede…
                </div>
              ) : lanAddresses.length > 0 ? (
                <div className="space-y-2">
                  {lanAddresses.map((item) => (
                    <div key={`${item.interface}-${item.address}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <code className="text-base font-black text-foreground">{item.address}</code>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {item.interface}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{item.url}</p>
                      </div>
                      <CopyButton value={item.url} label="Copiar endereço" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                  Nenhum IPv4 de rede local foi encontrado. Verifique se o computador servidor está conectado ao Wi‑Fi ou cabo de rede.
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Para abrir o HealthCall em outro computador, tablet ou celular, os dispositivos precisam estar na mesma rede local e usar um dos endereços acima. O firewall do computador servidor também deve permitir a porta do HealthCall.
            </p>
          </>
        )}
      </div>
    </SettingsGroup>
  );
}
