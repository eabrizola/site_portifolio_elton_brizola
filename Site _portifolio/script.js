document.addEventListener("DOMContentLoaded", () => {
  const isLocalFile = window.location.protocol === "file:";

  // 1. Atualiza o ano no rodapé automaticamente
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // 2. Menu mobile responsivo em todas as páginas
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 3. Normalização de texto para busca sem acento
  const normalizeText = (str) =>
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // 4. Criação de card de obra
  const createArtCard = (obra, onOpen) => {
    const card = document.createElement("article");
    card.className = "art-card";
    card.tabIndex = 0;

    const frame = document.createElement("div");
    frame.className = "art-frame";

    const img = document.createElement("img");
    img.src = obra.imagem || "";
    img.alt = obra.titulo || "Obra";
    img.loading = "lazy";
    frame.appendChild(img);

    const body = document.createElement("div");
    body.className = "art-body";

    const title = document.createElement("h3");
    title.className = "art-title";
    title.textContent = obra.titulo || "Sem título";

    const meta = document.createElement("p");
    meta.className = "art-meta";
    meta.textContent = [obra.tecnicaLabel || obra.tecnica, obra.ano]
      .filter(Boolean)
      .join(" • ");

    body.appendChild(title);
    body.appendChild(meta);

    card.appendChild(frame);
    card.appendChild(body);

    if (onOpen) {
      card.addEventListener("click", () => onOpen(obra));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(obra);
        }
      });
    }

    return card;
  };

  // 5. Lightbox (Modal de ampliação na Galeria)
  const lightbox = document.querySelector("[data-lightbox]");
  const lbImg = document.querySelector("[data-lightbox-img]");
  const lbTitle = document.querySelector("[data-lightbox-title]");
  const lbMeta = document.querySelector("[data-lightbox-meta]");
  const lbDesc = document.querySelector("[data-lightbox-desc]");
  const lbClose = document.querySelector("[data-lightbox-close]");

  const openLightbox = (obra) => {
    if (!lightbox || !lbImg) return;
    lbImg.src = obra.imagem || "";
    lbImg.alt = obra.titulo || "";
    if (lbTitle) lbTitle.textContent = obra.titulo || "";
    if (lbMeta) {
      lbMeta.textContent = [obra.tecnicaLabel || obra.tecnica, obra.dimensoes, obra.ano]
        .filter(Boolean)
        .join(" • ");
    }
    if (lbDesc) lbDesc.textContent = obra.descricao || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (lightbox) {
    lbClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
    });
  }

  // 6. Carregamento do obras.json (Destaques no Início e Catálogo na Galeria)
  const featuredContainer = document.querySelector("[data-featured-gallery]");
  const galleryGrid = document.querySelector("[data-gallery-grid]");

  if (featuredContainer || galleryGrid) {
    fetch("obras.json")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar obras.json");
        return res.json();
      })
      .then((obras) => {
        if (!Array.isArray(obras)) return;

        if (featuredContainer) {
          const destaques = obras.filter((o) => o.destaque).slice(0, 4);
          const listaHome = destaques.length ? destaques : obras.slice(0, 4);
          featuredContainer.innerHTML = "";
          listaHome.forEach((obra) => {
            featuredContainer.appendChild(
              createArtCard(obra, () => {
                window.location.href = "galeria.html";
              })
            );
          });
        }

        if (galleryGrid) {
          const filterButtons = document.querySelectorAll("[data-filter]");
          const searchInput = document.querySelector("[data-search-input]");
          const resetBtn = document.querySelector("[data-reset-filters]");
          const statusEl = document.querySelector("[data-gallery-status]");

          let activeFilter = "todas";
          let searchQuery = "";

          const renderGallery = () => {
            const queryNorm = normalizeText(searchQuery);

            const filtered = obras.filter((obra) => {
              const matchesCategory =
                activeFilter === "todas" ||
                normalizeText(obra.tecnica) === normalizeText(activeFilter);

              const searchableText = normalizeText(
                [
                  obra.titulo,
                  obra.tecnicaLabel,
                  obra.tecnica,
                  obra.ano,
                  obra.descricao,
                  ...(obra.tags || [])
                ].join(" ")
              );

              return matchesCategory && (!queryNorm || searchableText.includes(queryNorm));
            });

            galleryGrid.innerHTML = "";
            filtered.forEach((obra) => {
              galleryGrid.appendChild(createArtCard(obra, openLightbox));
            });

            if (statusEl) {
              statusEl.textContent =
                filtered.length === 1
                  ? "1 obra encontrada."
                  : `${filtered.length} obras encontradas.`;
            }
          };

          filterButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
              filterButtons.forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
              activeFilter = btn.dataset.filter || "todas";
              renderGallery();
            });
          });

          searchInput?.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderGallery();
          });

          resetBtn?.addEventListener("click", () => {
            activeFilter = "todas";
            searchQuery = "";
            if (searchInput) searchInput.value = "";
            filterButtons.forEach((b) =>
              b.classList.toggle("active", b.dataset.filter === "todas")
            );
            renderGallery();
          });

          renderGallery();
        }
      })
      .catch(() => {
        const statusEl = document.querySelector("[data-gallery-status]");
        if (statusEl) {
          statusEl.textContent = isLocalFile
            ? "Abra o site por um servidor web (ex: Live Server) para carregar o obras.json."
            : "Não foi possível carregar o catálogo de obras.";
        }
      });
  }

  // 7. Envio assíncrono do formulário de Contato
  const contactForm = document.querySelector("[data-contact-form]");
  const formStatus = document.querySelector("[data-form-status]");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isLocalFile) {
        if (formStatus) {
          formStatus.textContent =
            "Abra esta página através de um servidor web (http:// ou https://) para o formulário enviar.";
        }
        return;
      }

      if (formStatus) formStatus.textContent = "Enviando mensagem...";

      try {
        const response = await fetch(contactForm.action, {
          method: contactForm.method || "POST",
          body: new FormData(contactForm),
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          contactForm.reset();
          if (formStatus) {
            formStatus.textContent = "Mensagem enviada com sucesso! Obrigado pelo contato.";
          }
        } else if (formStatus) {
          formStatus.textContent =
            "Não foi possível enviar agora. Tente novamente ou use o e-mail direto.";
        }
      } catch {
        if (formStatus) {
          formStatus.textContent = "Erro de conexão ao enviar o formulário.";
        }
      }
    });
  }
});