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
const getPopularMovies = async ({
  page
}) => {
  const url = `${apiUrl}/movie/popular?page=${page}`;
  const res = await fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (res.ok) return await res.json();
  const errorBody = await res.json();
  throw new ApiError(errorBody.status_message, errorBody.status_code);
};
const getTopRatedMovies = async () => {
  const url = `${apiUrl}/movie/top_rated`;
  const res = await fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (res.ok) return await res.json();
  const errorBody = await res.json();
  throw new ApiError(errorBody.status_message, errorBody.status_code);
};
const getSearchMovies = async ({
  page,
  query
}) => {
  const url = `${apiUrl}/search/movie?page=${page}&query=${query}`;
  const res = await fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (res.ok) return await res.json();
  const errorBody = await res.json();
  throw new ApiError(errorBody.status_message, errorBody.status_code);
};
const renderTopRatedMovie = (movie) => {
  const topRatedContainer = document.querySelector(".top-rated-container");
  if (!topRatedContainer) return null;
  const overlay = document.querySelector(".overlay");
  if (!overlay) return null;
  overlay.style.background = `url(${`https://media.themoviedb.org/t/p/w1920_and_h800_multi_faces` + movie.backdrop_path}) center center no-repeat`;
  const rateValue = topRatedContainer.querySelector(".rate-value");
  if (!rateValue) return null;
  rateValue.textContent = movie.vote_average.toString();
  const title = topRatedContainer.querySelector(".title");
  if (!title) return null;
  title.textContent = movie.title;
};
const removeTopRatedMovie = () => {
  const topRatedMovie = document.querySelector(".top-rated-movie");
  if (!topRatedMovie) return null;
  topRatedMovie.style.display = "none";
  const background = document.querySelector(
    ".background-container"
  );
  if (!background) return null;
  background.style.backgroundColor = "transparent";
  background.style.height = "auto";
  const overlay = document.querySelector(".overlay");
  if (!overlay) return null;
  overlay.style.background = "";
  overlay.style.display = "none";
};
const renderMoreButton = () => {
  const moreButton = document.querySelector("#more-button");
  if (!moreButton) return null;
  moreButton.style.display = "block";
};
const removeMoreButton = () => {
  const moreButton = document.querySelector("#more-button");
  if (!moreButton) return null;
  moreButton.style.display = "none";
};
const updateMoreButton = (currentPage, totalPages) => {
  if (currentPage === totalPages) {
    removeMoreButton();
    return;
  }
  renderMoreButton();
};
const createMovieNode = (movie) => {
  const movieTemplate = document.querySelector(`#movie-template`);
  if (!movieTemplate) return null;
  const movieFragment = movieTemplate.content.cloneNode(
    true
  );
  const movieItem = movieFragment.querySelector("li");
  if (!movieItem) return null;
  movieItem.dataset.movieId = String(movie.id);
  const thumbnail = movieFragment.querySelector(".thumbnail");
  if (!thumbnail) return null;
  thumbnail.src = `https://media.themoviedb.org/t/p/w220_and_h330_face` + movie.poster_path;
  thumbnail.alt = movie.title;
  const itemDesc = movieFragment.querySelector(".item-desc");
  const rate = itemDesc?.querySelector("span");
  if (!rate) return null;
  rate.textContent = movie.vote_average.toString();
  const title = itemDesc?.querySelector("strong");
  if (!title) return null;
  title.textContent = movie.title;
  return movieFragment;
};
const renderMovieList = (movies) => {
  const movieList = document.querySelector("#movie-list");
  movies.results.forEach((movie) => {
    const movieNode = createMovieNode(movie);
    if (movieNode) {
      movieList?.appendChild(movieNode);
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
  removeMoreButton();
};
const removeMovieList = () => {
  const movieList = document.querySelector("#movie-list");
  if (!movieList) return;
  const noResult = document.querySelector("#no-result");
  if (!noResult) return;
  movieList.replaceChildren();
  noResult.replaceChildren();
};
const renderSkeleton = () => {
  const skeleton = document.querySelector("#skeleton");
  if (!skeleton) return;
  const skeletonTemplate = document.querySelector("#movie-template");
  if (!skeletonTemplate) return null;
  for (let i = 0; i < 20; i++) {
    const skeletonCloneNode = skeletonTemplate.content.cloneNode(
      true
    );
    if (!skeletonCloneNode) return null;
    skeleton.appendChild(skeletonCloneNode);
  }
};
const removeSkeleton = () => {
  const skeleton = document.querySelector("#skeleton");
  if (!skeleton) return;
  skeleton.classList.add("animation");
  setTimeout(() => {
    skeleton.classList.remove("animation");
    skeleton.replaceChildren();
  }, 3e3);
};
class PageState {
  #page;
  constructor() {
    this.#page = 1;
  }
  getPage() {
    return this.#page;
  }
  incrementPage() {
    this.#page += 1;
  }
  resetPage() {
    this.#page = 1;
  }
}
const pageState = new PageState();
const showErrorAlert = (error) => {
  if (error instanceof ApiError && error.status_code === 22) {
    alert("잘못된 페이지 요청입니다.");
    return;
  }
  alert("영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
};
const loadTopRatedMovie = async () => {
  try {
    const topRatedMovies = await getTopRatedMovies();
    const topRatedMovie = topRatedMovies.results[0];
    if (!topRatedMovie) return;
    renderTopRatedMovie(topRatedMovie);
  } catch (e) {
    showErrorAlert(e);
  }
};
const loadPopularMovies = async () => {
  try {
    renderSkeleton();
    const page = pageState.getPage();
    const movies = await getPopularMovies({ page });
    if (movies) {
      renderMovieList(movies);
      updateMoreButton(movies.page, movies.total_pages);
    }
  } catch (e) {
    showErrorAlert(e);
  } finally {
    removeSkeleton();
  }
};
const loadSearchMovies = async () => {
  try {
    const search = getSearchParams("search");
    const page = pageState.getPage();
    const movies = await getSearchMovies({
      page,
      query: search || ""
    });
    removeTopRatedMovie();
    const movieListTitle = document.querySelector("#movie-list-title");
    if (!movieListTitle) return null;
    movieListTitle.textContent = `"${search}" 검색 결과`;
    if (movies.results.length) {
      renderMovieList(movies);
      updateMoreButton(movies.page, movies.total_pages);
    } else {
      renderNoResult();
    }
  } catch (e) {
    showErrorAlert(e);
  }
};
const loadMoreMovies = async () => {
  pageState.incrementPage();
  const isSearchParams = hasSearchParams("search");
  if (isSearchParams) {
    loadSearchMovies();
    return;
  }
  loadPopularMovies();
};
const handleSearch = () => {
  const searchInput = document.querySelector("#search-input");
  if (!searchInput) return;
  const search = searchInput.value || "";
  if (!search.length) {
    searchInput.focus();
    return;
  }
  pageState.resetPage();
  const searchUrl = new URL(baseUrl, window.location.origin);
  searchUrl.searchParams.set("search", search);
  navigate(`${searchUrl.pathname}${searchUrl.search}`);
  removeMovieList();
  loadSearchMovies();
};
addEventListener("load", () => {
  const logo = document.querySelector(".logo");
  logo?.addEventListener("click", () => {
    window.location.href = baseUrl;
  });
  const searchButton = document.querySelector("#search-button");
  searchButton?.addEventListener("click", () => {
    handleSearch();
  });
  const searchInput = document.querySelector("#search-input");
  searchInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
  const moreButton = document.querySelector("#more-button");
  moreButton?.addEventListener("click", () => {
    loadMoreMovies();
  });
  loadTopRatedMovie();
  loadPopularMovies();
});
