(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const apiUrl = "https://api.themoviedb.org/3";
const apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMWJhN2U3MjZiNzFjYTA2NzhhNDk0YmNjZGEwNTJmNyIsIm5iZiI6MTc3MDAxMDg1Ni4xNDcsInN1YiI6IjY5ODAzOGU4NmU1ZDViMzVhYjFiZDk1YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.6Enl0Fcm7_Zz6xTIjoVDG30wdPxkJxPaV3VS19WFwn4";
const baseUrl = "/javascript-movie-review/";
class ApiError extends Error {
  status_code;
  constructor(message, status_code) {
    super(message);
    this.name = "ApiError";
    this.status_code = status_code;
  }
}
const requestGet = async (path) => {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (res.ok) return await res.json();
  const errorBody = await res.json();
  throw new ApiError(errorBody.status_message, errorBody.status_code);
};
const getPopularMovies = async ({
  page
}) => {
  return requestGet(`/movie/popular?page=${page}&language=ko-KR`);
};
const getTopRatedMovies = async () => {
  return requestGet(`/movie/top_rated?language=ko-KR`);
};
const getSearchMovies = async ({
  page,
  query
}) => {
  return requestGet(
    `/search/movie?page=${page}&query=${query}&language=ko-KR`
  );
};
const getMovieDetail = async (movieId) => {
  return requestGet(`/movie/${movieId}?language=ko-KR`);
};
const TMDB_IMAGE_BASE_URL = "https://media.themoviedb.org/t/p";
const getImageUrl = (path, size) => {
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};
const renderTopRatedMovie = (movie) => {
  const topRatedContainer = document.querySelector(
    ".background-container"
  );
  if (!topRatedContainer) return;
  topRatedContainer.style.backgroundImage = `url(${getImageUrl(movie.backdrop_path, "w1920_and_h800_multi_faces")})`;
  const rateValue = topRatedContainer.querySelector(".rate-value");
  if (rateValue) {
    rateValue.textContent = movie.vote_average.toString();
  }
  const title = topRatedContainer.querySelector(".title");
  if (title) {
    title.textContent = movie.title;
  }
};
const removeTopRatedMovie = () => {
  const topRatedMovie = document.querySelector(".top-rated-movie");
  if (topRatedMovie) {
    topRatedMovie.style.display = "none";
  }
  const topRatedContainer = document.querySelector(
    ".background-container"
  );
  if (topRatedContainer) {
    topRatedContainer.style.backgroundImage = "";
    topRatedContainer.style.height = "auto";
  }
  const overlay = document.querySelector(".overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
};
const createMovieNode = (movie) => {
  const movieTemplate = document.querySelector(`#movie-template`);
  if (!movieTemplate) return null;
  const movieFragment = movieTemplate.content.cloneNode(
    true
  );
  const movieItem = movieFragment.querySelector("li");
  const thumbnail = movieFragment.querySelector(".thumbnail");
  const rate = movieFragment.querySelector(".item-desc span");
  const title = movieFragment.querySelector(".item-desc strong");
  if (!movieItem || !thumbnail || !rate || !title) return null;
  movieItem.dataset.movieId = String(movie.id);
  thumbnail.src = getImageUrl(movie.poster_path, "w220_and_h330_face");
  thumbnail.alt = movie.title;
  rate.textContent = movie.vote_average.toString();
  title.textContent = movie.title;
  return movieFragment;
};
const renderSearchTitle = (search) => {
  const movieListTitle = document.querySelector("#movie-list-title");
  if (!movieListTitle) return null;
  movieListTitle.textContent = `"${search}" 검색 결과`;
};
const renderMovieList = (movies) => {
  const movieList = document.querySelector("#movie-list");
  if (!movieList) return;
  movieList.hidden = false;
  movies.results.forEach((movie) => {
    const movieNode = createMovieNode(movie);
    if (movieNode) {
      movieList.appendChild(movieNode);
    }
  });
};
const renderNoResult = () => {
  const noResult = document.querySelector("#no-result");
  if (!noResult) return;
  const empty = (
    /* html */
    `
  <p class="message-box">
    <img src="./public/images/mascot.png" alt="" />
    <span>검색 결과가 없습니다.</span>
  </p>`
  );
  noResult.innerHTML = empty;
};
const removeMovieList = () => {
  const noResult = document.querySelector("#no-result");
  if (noResult) {
    noResult.replaceChildren();
  }
  const movieList = document.querySelector("#movie-list");
  if (movieList) {
    movieList.replaceChildren();
    movieList.hidden = true;
  }
};
const renderMovieListSkeleton = () => {
  const skeleton = document.querySelector("#skeleton-list");
  if (!skeleton) return;
  skeleton.hidden = false;
};
const removeMovieListSkeleton = () => {
  const skeleton = document.querySelector("#skeleton-list");
  if (!skeleton) return;
  skeleton.hidden = true;
};
const renderMovieDetailSkeleton = () => {
  const movieModal = document.querySelector(".modal");
  if (!movieModal) return;
  movieModal.classList.add("loading");
};
const removeMovieDetailSkeleton = () => {
  const movieModal = document.querySelector(".modal");
  if (!movieModal) return;
  movieModal.classList.remove("loading");
};
class PageState {
  #page;
  #totalPages;
  constructor() {
    this.#page = 0;
    this.#totalPages = null;
  }
  getPage() {
    return this.#page;
  }
  incrementPage() {
    this.#page += 1;
  }
  setTotalPages(totalPages) {
    this.#totalPages = totalPages;
  }
  resetPage() {
    this.#page = 0;
    this.#totalPages = null;
  }
  isLastPage() {
    if (this.#totalPages === null) return false;
    return this.#page >= this.#totalPages;
  }
}
const navigate = (path) => {
  history.pushState(null, "", path);
};
const getSearchParams = (queryKey) => {
  const params = new URLSearchParams(location.search);
  return params.get(queryKey);
};
const hasSearchParams = (queryKey) => {
  const params = new URLSearchParams(location.search);
  return params.get(queryKey) === null ? false : true;
};
const createSearchUrl = (baseUrl2, search) => {
  const searchUrl = new URL(baseUrl2, window.location.origin);
  searchUrl.searchParams.set("search", search);
  return `${searchUrl.pathname}${searchUrl.search}`;
};
const showError = (error) => {
  if (error instanceof ApiError && error.status_code === 22) {
    alert("잘못된 페이지 요청입니다.");
    return;
  }
  alert("영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
};
const RATING_TEXTS = [
  "최악이에요",
  "별로에요",
  "보통이에요",
  "재밌어요",
  "명작이에요"
];
const RATING_SCORES = ["2", "4", "6", "8", "10"];
const isRatingScore = (value) => {
  return value !== null && RATING_SCORES.includes(value);
};
const localStorageRepository = {
  get(key) {
    return window.localStorage.getItem(key);
  },
  set(key, value) {
    window.localStorage.setItem(key, value);
  }
};
const ratingStorage = localStorageRepository;
const restoreRatingView = (movieId) => {
  const savedRating = ratingStorage.get(movieId);
  if (!isRatingScore(savedRating)) return;
  const index = RATING_SCORES.indexOf(savedRating);
  fillRatingStars(index);
  updateRatingSummary(index);
};
const fillRatingStars = (index) => {
  const stars = document.querySelectorAll(".stars img");
  stars.forEach((currentStar, currentIndex) => {
    currentStar.src = currentIndex <= index ? "./images/star_filled.png" : "./images/star_empty.png";
  });
};
const updateRatingSummary = (index) => {
  const ratingText = document.querySelector(".rating-text");
  if (ratingText) ratingText.textContent = RATING_TEXTS[index];
  const ratingValue = document.querySelector("#rating-value");
  if (ratingValue) ratingValue.textContent = RATING_SCORES[index];
};
const resetRatingView = (movieModal) => {
  const stars = movieModal.querySelectorAll(".stars img");
  stars.forEach((star) => star.src = "./images/star_empty.png");
  const ratingText = movieModal.querySelector(".rating-text");
  if (ratingText) ratingText.textContent = "평가해주세요";
  const ratingValue = movieModal.querySelector("#rating-value");
  if (ratingValue) ratingValue.textContent = "0";
};
const renderMovieDetail = (movieDetail) => {
  const movieModal = document.querySelector(".modal");
  if (!movieModal) return;
  movieModal.dataset.movieId = String(movieDetail.id);
  const releaseYear = new Date(movieDetail.release_date).getFullYear();
  const genres = movieDetail.genres.map((genre) => genre.name).join(", ");
  updateMovieDetailContent(movieModal, {
    imageSrc: getImageUrl(movieDetail.poster_path, "w300_and_h450_face"),
    title: movieDetail.title,
    category: `${releaseYear} · ${genres}`,
    rate: movieDetail.vote_average.toString(),
    detail: movieDetail.overview
  });
  restoreRatingView(String(movieDetail.id));
};
const clearMovieDetail = () => {
  const movieModal = document.querySelector(".modal");
  if (!movieModal) return;
  updateMovieDetailContent(movieModal, {
    imageSrc: "",
    title: "",
    category: "",
    rate: "",
    detail: ""
  });
  resetRatingView(movieModal);
};
const getMovieDetailElements = (movieModal) => {
  const modalImage = movieModal.querySelector(".modal-image img");
  const title = movieModal.querySelector("h2");
  const category = movieModal.querySelector(".category");
  const rate = movieModal.querySelector(".rate-value");
  const detail = movieModal.querySelector(".detail");
  return { modalImage, title, category, rate, detail };
};
const updateMovieDetailContent = (movieModal, viewData) => {
  const { modalImage, title, category, rate, detail } = getMovieDetailElements(movieModal);
  if (modalImage) modalImage.src = viewData.imageSrc;
  if (title) title.textContent = viewData.title;
  if (category) category.textContent = viewData.category;
  if (rate) rate.textContent = viewData.rate;
  if (detail) detail.textContent = viewData.detail;
};
const popularPageState = new PageState();
const searchPageState = new PageState();
const loadTopRatedMovie = async () => {
  try {
    const topRatedMovies = await getTopRatedMovies();
    const topRatedMovie = topRatedMovies.results[0];
    if (!topRatedMovie) return;
    renderTopRatedMovie(topRatedMovie);
  } catch (e) {
    showError(e);
  }
};
const loadPopularMovies = async () => {
  if (popularPageState.isLastPage()) return true;
  try {
    renderMovieListSkeleton();
    const page = popularPageState.getPage() + 1;
    const movies = await getPopularMovies({ page });
    if (movies) {
      renderMovieList(movies);
      popularPageState.incrementPage();
      popularPageState.setTotalPages(movies.total_pages);
    }
    return popularPageState.isLastPage();
  } catch (e) {
    showError(e);
    return true;
  } finally {
    removeMovieListSkeleton();
  }
};
const loadSearchMovies = async ({
  reset = false
} = {}) => {
  if (reset) {
    searchPageState.resetPage();
    removeMovieList();
  }
  if (!reset && searchPageState.isLastPage()) return true;
  try {
    renderMovieListSkeleton();
    const search = getSearchParams("search");
    const page = searchPageState.getPage() + 1;
    const movies = await getSearchMovies({
      page,
      query: search || ""
    });
    removeTopRatedMovie();
    renderSearchTitle(search);
    if (movies.results.length) {
      renderMovieList(movies);
      searchPageState.incrementPage();
      searchPageState.setTotalPages(movies.total_pages);
    } else {
      renderNoResult();
    }
    return searchPageState.isLastPage();
  } catch (e) {
    showError(e);
    return true;
  } finally {
    removeMovieListSkeleton();
  }
};
const loadMovieList = async () => {
  const isSearchParams = hasSearchParams("search");
  if (isSearchParams) return await loadSearchMovies();
  return await loadPopularMovies();
};
const loadMovieDetail = async (movieId) => {
  try {
    const movieDetail = await getMovieDetail(movieId);
    renderMovieDetail(movieDetail);
  } catch (e) {
    showError(e);
  } finally {
    removeMovieDetailSkeleton();
  }
};
const openMovieModal = () => {
  const movieModal = document.querySelector("#modal-background");
  if (!movieModal) return;
  movieModal.classList.add("active");
  document.body.classList.add("modal-open");
};
const closeMovieModal = () => {
  const movieModal = document.querySelector("#modal-background");
  if (!movieModal) return;
  movieModal.classList.remove("active");
  document.body.classList.remove("modal-open");
};
const handleMovieItemClick = async (e) => {
  const target = e.target;
  const movieItem = target.closest("li");
  if (!movieItem) return;
  const movieId = movieItem.dataset.movieId;
  if (!movieId) return;
  renderMovieDetailSkeleton();
  openMovieModal();
  await loadMovieDetail(movieId);
};
const handleModalCloseButtonClick = () => {
  clearMovieDetail();
  closeMovieModal();
};
const handleModalEscapeKeydown = handleModalCloseButtonClick;
const handleModalBackdropClick = handleModalCloseButtonClick;
const handleRatingStarClick = (index) => {
  const ratingScore = RATING_SCORES[index];
  if (!isRatingScore(ratingScore)) return;
  fillRatingStars(index);
  updateRatingSummary(index);
  const movieModal = document.querySelector(".modal");
  if (!movieModal) return;
  const movieId = movieModal.dataset.movieId;
  if (!movieId) return;
  ratingStorage.set(movieId, ratingScore);
};
let isLoading = false;
const initializeMovieListObserver = () => {
  const sentinel = document.querySelector(".scroll-sentinel");
  if (!sentinel) return;
  const movieListObserver = new IntersectionObserver(
    async (entries, observer) => {
      const [sentinelEntry] = entries;
      if (!sentinelEntry.isIntersecting) return;
      if (isLoading) return;
      isLoading = true;
      try {
        const isLastPage = await loadMovieList();
        if (isLastPage) {
          observer.disconnect();
        }
      } finally {
        isLoading = false;
      }
    },
    { rootMargin: "300px" }
  );
  movieListObserver.observe(sentinel);
};
const handleSearchButtonClick = () => {
  const searchInput = document.querySelector("#search-input");
  if (!searchInput) return;
  const search = searchInput.value || "";
  if (!search.length) {
    searchInput.focus();
    return;
  }
  const url = createSearchUrl(baseUrl, search);
  navigate(url);
  loadSearchMovies({ reset: true });
  initializeMovieListObserver();
};
const handleSearchInputEnter = handleSearchButtonClick;
const bindSearchEvents = () => {
  const searchButton = document.querySelector("#search-button");
  searchButton?.addEventListener("click", handleSearchButtonClick);
  const searchInput = document.querySelector("#search-input");
  searchInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      handleSearchInputEnter();
    }
  });
};
const bindRatingEvents = () => {
  const stars = document.querySelectorAll(".stars img");
  stars.forEach((star, index) => {
    star.addEventListener("click", () => handleRatingStarClick(index));
  });
};
const bindModalEvents = () => {
  const movieList = document.querySelector("#movie-list");
  movieList?.addEventListener("click", handleMovieItemClick);
  const closeModal = document.querySelector("#close-modal");
  closeModal?.addEventListener("click", handleModalCloseButtonClick);
  const modalBackground = document.querySelector("#modal-background");
  modalBackground?.addEventListener("click", () => {
    handleModalBackdropClick();
  });
  const modal = document.querySelector(".modal");
  modal?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("keydown", (event) => {
    const modalBackground2 = document.querySelector("#modal-background");
    if (!modalBackground2?.classList.contains("active")) return;
    console.log("esc");
    if (event.key === "Escape") {
      handleModalEscapeKeydown();
    }
  });
};
addEventListener("load", () => {
  const logo = document.querySelector(".logo");
  logo?.addEventListener("click", () => {
    window.location.href = baseUrl;
  });
  bindSearchEvents();
  bindModalEvents();
  bindRatingEvents();
  loadTopRatedMovie();
  loadMovieList();
  initializeMovieListObserver();
});
