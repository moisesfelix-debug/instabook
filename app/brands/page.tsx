import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Brand = {
  id: string;
  name: string;
  segment: string | null;
  instagram_handle: string | null;
};

const demoBrands: Brand[] = [
  { id: "demo-1", name: "Restaurante Vila", segment: "Gastronomia", instagram_handle: "@restaurantevila" },
  { id: "demo-2", name: "SaborBoost", segment: "Marketing", instagram_handle: "@saborboost" },
  { id: "demo-3", name: "Clínica Aurora", segment: "Saúde & estética", instagram_handle: "@clinicaaurora" },
];

export default async function BrandsPage() {
  let brands = demoBrands;
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("brands")
      .select("id,name,segment,instagram_handle")
      .order("created_at", { ascending: false });

    brands = (data as Brand[] | null) ?? [];
  }

  return (
    <AppShell>
      <header>
        <div>
          <h1>Marcas & clientes</h1>
          <p>Identidade, estratégia e canais usados pela IA em cada conteúdo.</p>
        </div>
        <Link className="cta" href="/brands/new">＋ Nova marca</Link>
      </header>

      {brands.length === 0 ? (
        <article className="panel emptyState">
          <span className="emptyIcon">✦</span>
          <h2>Sua primeira marca começa aqui</h2>
          <p>Cadastre a identidade da marca para começar a criar conteúdos com IA.</p>
          <Link className="cta" href="/brands/new">Cadastrar primeira marca</Link>
        </article>
      ) : (
        <div className="brandCards">
          {brands.map((brand, i) => (
            <article className="panel brandCard" key={brand.id}>
              <div className={"bigBrand b" + (i % 3)}>
                {brand.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
              </div>
              <div>
                <small>{brand.segment || "Sem segmento"}</small>
                <h2>{brand.name}</h2>
                <p>{brand.instagram_handle || "Instagram não conectado"}</p>
              </div>
              <div className="brandStats">
                <span><b>{configured ? "0" : ["28","42","19"][i] || "0"}</b><small>conteúdos</small></span>
                <span><b>{configured ? "—" : ["5,6%","4,9%","3,8%"][i] || "—"}</b><small>engajamento</small></span>
              </div>
              <button className="secondaryBtn">Abrir marca</button>
            </article>
          ))}
        </div>
      )}

      {!configured && <p className="demoNotice">Modo demonstração: conecte o Supabase para usar dados reais.</p>}
    </AppShell>
  );
}
