import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  createAgencyClient,
  deleteAgencyClient,
  deleteBrand,
  updateAgencyClient,
} from "./actions";

type Brand = {
  id: string;
  client_id: string | null;
  name: string;
  segment: string | null;
  instagram_handle: string | null;
};

type Client = {
  id: string;
  name: string;
  email: string | null;
};

export default async function BrandsPage() {
  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: brandsData }, { data: clientsData }] = await Promise.all([
    supabase
      .from("brands")
      .select("id,client_id,name,segment,instagram_handle")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id,name,email")
      .eq("workspace_id", workspace.id)
      .order("name"),
  ]);

  const brands = (brandsData as Brand[] | null) ?? [];
  const clients = (clientsData as Client[] | null) ?? [];
  const clientNames = new Map(clients.map((client) => [client.id, client.name] as const));

  return (
    <AppShell>
      <header>
        <div>
          <h1>Marcas & clientes</h1>
          <p>Gerencie as marcas e clientes reais deste workspace.</p>
        </div>
        <Link prefetch={false} className="cta" href="/brands/new">＋ Nova marca</Link>
      </header>

      {brands.length === 0 ? (
        <article className="panel emptyState">
          <span className="emptyIcon">✦</span>
          <h2>Sua primeira marca começa aqui</h2>
          <p>Cadastre identidade, público e tom de voz para começar a criar conteúdos.</p>
          <Link prefetch={false} className="cta" href="/brands/new">Cadastrar primeira marca</Link>
        </article>
      ) : (
        <div className="brandCards">
          {brands.map((brand, i) => (
            <article className="panel brandCard" key={brand.id}>
              <div className={"bigBrand b" + (i % 3)}>
                {brand.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <small>{brand.segment || "Sem segmento"}</small>
                <h2>{brand.name}</h2>
                <p>{brand.instagram_handle || "Instagram não informado"}</p>
                {brand.client_id && (
                  <span className="brandClient">
                    Cliente: {clientNames.get(brand.client_id) || "Cliente vinculado"}
                  </span>
                )}
              </div>

              <div className="brandStats">
                <span><b>0</b><small>conteúdos</small></span>
                <span><b>—</b><small>engajamento</small></span>
              </div>

              <div className="brandActions">
                <Link prefetch={false} className="secondaryBtn" href={`/brands/${brand.id}/edit`}>Editar marca</Link>
                <form action={deleteBrand}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <button className="dangerBtn" type="submit">Excluir</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      <article className="panel clientManager">
        <div className="panelHead">
          <div>
            <h2>Clientes</h2>
            <p>Use clientes para organizar várias marcas em um workspace de agência.</p>
          </div>
          <span className="countBadge">{clients.length}</span>
        </div>

        <form className="clientCreateForm" action={createAgencyClient}>
          <input name="clientName" required placeholder="Nome do cliente" />
          <input name="clientEmail" type="email" placeholder="E-mail (opcional)" />
          <button className="cta" type="submit">Adicionar cliente</button>
        </form>

        {clients.length === 0 ? (
          <div className="clientEmpty">Nenhum cliente cadastrado. Sua marca atual pode continuar sem cliente vinculado.</div>
        ) : (
          <div className="clientList">
            {clients.map((client) => (
              <div className="clientRow" key={client.id}>
                <form className="clientEditForm" action={updateAgencyClient}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <input name="clientName" defaultValue={client.name} aria-label="Nome do cliente" />
                  <input name="clientEmail" type="email" defaultValue={client.email || ""} placeholder="E-mail" aria-label="E-mail do cliente" />
                  <button className="secondaryBtn" type="submit">Salvar</button>
                </form>
                <form action={deleteAgencyClient}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <button className="dangerBtn" type="submit">Excluir</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </article>
    </AppShell>
  );
}
