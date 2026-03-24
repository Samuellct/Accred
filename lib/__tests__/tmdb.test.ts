import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// mock fs avant l'import du module
vi.mock("fs", () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// mock TMDB_API_KEY
vi.stubEnv("TMDB_API_KEY", "test-api-key");

const { searchFilm, getFilmDetails, downloadPoster } = await import("../tmdb");

const SEARCH_RESPONSE = {
  results: [
    {
      id: 1064213,
      title: "Anora",
      original_title: "Anora",
      release_date: "2024-10-18",
      poster_path: "/poster.jpg",
      overview: "Une jeune femme rencontre...",
    },
    {
      id: 12345,
      title: "Autre film",
      original_title: "Another Film",
      release_date: "",
      poster_path: null,
      overview: "",
    },
  ],
};

const DETAILS_RESPONSE = {
  id: 1064213,
  title: "Anora",
  original_title: "Anora",
  release_date: "2024-10-18",
  runtime: 139,
  genres: [{ id: 35, name: "Comedie" }, { id: 18, name: "Drame" }],
  production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
  overview: "Une jeune femme rencontre...",
  poster_path: "/poster.jpg",
  imdb_id: "tt20215234",
  credits: {
    crew: [
      { job: "Director", name: "Sean Baker" },
      { job: "Producer", name: "Somebody Else" },
    ],
  },
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchFilm", () => {
  it("retourne les resultats mappes correctement", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => SEARCH_RESPONSE,
    } as Response);

    const results = await searchFilm("Anora", 2024);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      tmdbId: 1064213,
      title: "Anora",
      originalTitle: "Anora",
      year: 2024,
      posterPath: "/poster.jpg",
    });
  });

  it("retourne year=null si release_date vide", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => SEARCH_RESPONSE,
    } as Response);

    const results = await searchFilm("Autre film");
    expect(results[1].year).toBeNull();
    expect(results[1].posterPath).toBeNull();
  });

  it("inclut la cle API dans l'URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    await searchFilm("test");
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("api_key=test-api-key");
    expect(calledUrl).toContain("query=test");
    expect(calledUrl).toContain("language=fr-FR");
  });

  it("lance une erreur si fetch echoue", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    await expect(searchFilm("test")).rejects.toThrow("401");
  });
});

describe("getFilmDetails", () => {
  it("extrait le realisateur des credits crew", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => DETAILS_RESPONSE,
    } as Response);

    const details = await getFilmDetails(1064213);
    expect(details.director).toBe("Sean Baker");
    expect(details.duration).toBe(139);
    expect(details.genres).toEqual(["Comedie", "Drame"]);
    expect(details.countries).toEqual(["United States of America"]);
    expect(details.imdbId).toBe("tt20215234");
  });

  it("director=null si pas de realisateur dans les credits", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...DETAILS_RESPONSE, credits: { crew: [] } }),
    } as Response);

    const details = await getFilmDetails(1064213);
    expect(details.director).toBeNull();
  });

  it("inclut append_to_response=credits dans l'URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => DETAILS_RESPONSE,
    } as Response);

    await getFilmDetails(1064213);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("append_to_response=credits");
  });
});

describe("downloadPoster", () => {
  it("appelle writeFileSync avec le bon chemin", async () => {
    const { writeFileSync } = await import("fs");
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    const result = await downloadPoster("/poster.jpg", 42);
    expect(result).toBe("/posters/42.jpg");
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("42.jpg"),
      expect.any(Buffer)
    );
  });

  it("lance une erreur si le telechargement echoue", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(downloadPoster("/invalid.jpg", 1)).rejects.toThrow("404");
  });
});
