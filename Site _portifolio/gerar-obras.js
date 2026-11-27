const fs = require("fs");
const path = require("path");

const pastaImagens = path.join(__dirname, "imagens");
const arquivoSaida = path.join(__dirname, "obras.json");
const extensoesValidas = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const prefixosTecnica = [
  { prefixo: "xilo-", tecnica: "xilogravura", tecnicaLabel: "Xilogravura" },
  { prefixo: "bico-", tecnica: "bico-de-pena", tecnicaLabel: "Bico de Pena e Nanquim" },
  { prefixo: "oleo-", tecnica: "oleo", tecnicaLabel: "Pintura a Óleo" },
  { prefixo: "hq-", tecnica: "quadrinhos", tecnicaLabel: "Quadrinhos" }
];

// Se já existir obras.json, reaproveita descrições, anos, dimensões e destaques já editados
let obrasExistentes = [];
if (fs.existsSync(arquivoSaida)) {
  try {
    const lido = JSON.parse(fs.readFileSync(arquivoSaida, "utf8"));
    if (Array.isArray(lido)) obrasExistentes = lido;
  } catch {
    obrasExistentes = [];
  }
}

const mapaExistentes = new Map(
  obrasExistentes.map((item) => [item.imagem, item])
);

const detectarTecnica = (nomeSemExtensao) => {
  const lower = nomeSemExtensao.toLowerCase();
  const achado = prefixosTecnica.find((p) => lower.startsWith(p.prefixo));
  if (achado) {
    return {
      tecnica: achado.tecnica,
      tecnicaLabel: achado.tecnicaLabel,
      nomeLimpo: nomeSemExtensao.slice(achado.prefixo.length)
    };
  }
  return {
    tecnica: "outras",
    tecnicaLabel: "Outras Linguagens",
    nomeLimpo: nomeSemExtensao
  };
};

const formatarTitulo = (slug) =>
  slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

if (!fs.existsSync(pastaImagens)) {
  console.error("Pasta 'imagens' não encontrada na raiz do projeto.");
  process.exit(1);
}

const arquivos = fs
  .readdirSync(pastaImagens)
  .filter((arquivo) => extensoesValidas.has(path.extname(arquivo).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

const resultado = arquivos.map((arquivo, indice) => {
  const caminhoRelativo = `imagens/${arquivo}`;
  const anterior = mapaExistentes.get(caminhoRelativo);
  const ext = path.extname(arquivo);
  const base = arquivo.slice(0, -ext.length);
  const { tecnica, tecnicaLabel, nomeLimpo } = detectarTecnica(base);
  const tituloGerado = formatarTitulo(nomeLimpo);
  const palavrasTag = tituloGerado
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  return {
    titulo: anterior?.titulo || tituloGerado,
    tecnica: anterior?.tecnica || tecnica,
    tecnicaLabel: anterior?.tecnicaLabel || tecnicaLabel,
    ano: anterior?.ano || String(new Date().getFullYear()),
    dimensoes: anterior?.dimensoes || "",
    imagem: caminhoRelativo,
    descricao: anterior?.descricao || "",
    tags: anterior?.tags?.length
      ? anterior.tags
      : Array.from(new Set([tecnica, ...palavrasTag])),
    destaque: typeof anterior?.destaque === "boolean" ? anterior.destaque : indice < 4
  };
});

fs.writeFileSync(arquivoSaida, JSON.stringify(resultado, null, 2), "utf8");
console.log(`obras.json gerado com ${resultado.length} obra(s).`);