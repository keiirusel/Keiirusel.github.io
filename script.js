let animes = JSON.parse(localStorage.getItem('animes')) || [];
let seleccionadoIndex = null;

const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const animeListContainer = document.getElementById('anime-list-container');

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalGenres = document.getElementById('modal-genres');
const modalDescription = document.getElementById('modal-description');
const modalEpisodes = document.getElementById('modal-episodes');
const modalRatingContainer = document.getElementById('modal-rating');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');
const toggleDescription = document.getElementById('toggle-description');

const stars = modalRatingContainer.querySelectorAll('.star');
let currentRating = 0;

function actualizarEstrellas(rating) {
  stars.forEach(star => {
    const val = parseInt(star.getAttribute('data-value'));
    star.classList.toggle('selected', val <= rating);
  });
}

stars.forEach(star => {
  star.addEventListener('mouseenter', () => {
    const val = parseInt(star.getAttribute('data-value'));
    stars.forEach(s => s.classList.toggle('hover', parseInt(s.getAttribute('data-value')) <= val));
  });
  star.addEventListener('mouseleave', () => {
    stars.forEach(s => s.classList.remove('hover'));
  });
  star.addEventListener('click', () => {
    currentRating = parseInt(star.getAttribute('data-value'));
    actualizarEstrellas(currentRating);
  });
});

function mostrarAnimes() {
  animeListContainer.innerHTML = '';
  if (animes.length === 0) {
    animeListContainer.innerHTML = '<p style="text-align:center; color:#aaa;">No tienes animes guardados.</p>';
    return;
  }
  animes.forEach((anime, i) => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.index = i;
    card.innerHTML = `
      <img src="${anime.imagen}" alt="${anime.nombre}" />
      <div class="anime-info">
        <h3>${anime.nombre}</h3>
        <div class="stars">${'★'.repeat(anime.puntuacion)}${'☆'.repeat(5 - anime.puntuacion)}</div>
      </div>
    `;
    card.onclick = () => abrirModal(i);
    animeListContainer.appendChild(card);
  });
}

function abrirModal(index) {
  seleccionadoIndex = index;
  const anime = animes[index];
  modalImg.src = anime.imagen || 'https://via.placeholder.com/300x400?text=Sin+Imagen';
  modalTitle.textContent = anime.nombre;
  modalGenres.textContent = anime.generos ? anime.generos.join(', ') : 'Sin categorías';
  modalDescription.textContent = anime.descripcion || 'Sin descripción';
  modalDescription.classList.remove('expanded');
  toggleDescription.textContent = "Ver más";
  modalEpisodes.textContent = anime.capitulos || 'Desconocido';

  currentRating = anime.puntuacion || 0;
  actualizarEstrellas(currentRating);

  modal.style.display = 'flex';
}

toggleDescription.onclick = () => {
  modalDescription.classList.toggle('expanded');
  toggleDescription.textContent = modalDescription.classList.contains('expanded') ? "Ver menos" : "Ver más";
};

modalClose.onclick = () => {
  modal.style.display = 'none';
  seleccionadoIndex = null;
};

btnSave.onclick = () => {
  if (seleccionadoIndex === null) return;
  animes[seleccionadoIndex].puntuacion = currentRating;
  localStorage.setItem('animes', JSON.stringify(animes));
  mostrarAnimes();
  modal.style.display = 'none';
  seleccionadoIndex = null;
};

btnDelete.onclick = () => {
  if (seleccionadoIndex === null) return;
  if (confirm('¿Quieres eliminar este anime de tu lista?')) {
    animes.splice(seleccionadoIndex, 1);
    localStorage.setItem('animes', JSON.stringify(animes));
    mostrarAnimes();
    modal.style.display = 'none';
    seleccionadoIndex = null;
  }
};

async function buscarEnJikan(query) {
  if (!query) {
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
    return;
  }
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8`);
    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      resultsDiv.innerHTML = `<div style="padding:10px; color:#ccc;">No se encontraron resultados.</div>`;
      resultsDiv.style.display = 'block';
      return;
    }
    resultsDiv.innerHTML = data.data.map(anime => `
      <div class="result-item" data-mal-id="${anime.mal_id}">
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" />
        <div class="result-text">${anime.title}</div>
      </div>
    `).join('');
    resultsDiv.style.display = 'block';

    document.querySelectorAll('.result-item').forEach(item => {
      item.onclick = async () => {
        const mal_id = parseInt(item.getAttribute('data-mal-id'));
        const detalles = await cargarAnimeDesdeAPI(mal_id);
        if (detalles) {
          animes.push(detalles);
          localStorage.setItem('animes', JSON.stringify(animes));
          mostrarAnimes();
          resultsDiv.style.display = 'none';
          searchInput.value = '';
        }
      };
    });
  } catch (e) {
    resultsDiv.innerHTML = `<div style="padding:10px; color:#ccc;">Error buscando animes.</div>`;
    resultsDiv.style.display = 'block';
  }
}

async function cargarAnimeDesdeAPI(mal_id) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${mal_id}/full`);
    const data = await res.json();
    if (!data.data) {
      alert('No se pudo cargar la información del anime.');
      return null;
    }
    const a = data.data;
    return {
      nombre: a.title,
      imagen: a.images.jpg.image_url,
      descripcion: a.synopsis || 'Sin descripción',
      capitulos: a.episodes || 0,
      generos: a.genres ? a.genres.map(g => g.name) : [],
      puntuacion: 0
    };
  } catch (e) {
    alert('Error cargando detalles del anime.');
    return null;
  }
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (query.length >= 2) {
    buscarEnJikan(query);
  } else {
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
  }
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
    resultsDiv.style.display = 'none';
  }
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    seleccionadoIndex = null;
  }
});

mostrarAnimes();

const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const inputImportFile = document.getElementById('input-import-file');

btnExport.onclick = () => {
  if (animes.length === 0) {
    alert('No hay animes para exportar.');
    return;
  }
  const dataStr = JSON.stringify(animes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'lista-animes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

btnImport.onclick = () => {
  inputImportFile.click();
};

inputImportFile.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedAnimes = JSON.parse(event.target.result);
      if (!Array.isArray(importedAnimes)) throw new Error('Archivo inválido');
      for (const anime of importedAnimes) {
        if (!anime.nombre || !anime.imagen) throw new Error('Anime inválido en el archivo');
      }
      animes = importedAnimes;
      localStorage.setItem('animes', JSON.stringify(animes));
      mostrarAnimes();
      alert('Lista importada correctamente.');
    } catch (err) {
      alert('Error al importar el archivo: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
};
