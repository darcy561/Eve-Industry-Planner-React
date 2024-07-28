async function fetchAllPages(url) {
  try {
    const { data: firstPage, totalPages } = await fetchData(url, 1);

    if (!totalPages) {
      return firstPage;
    }

    const promises = [];
    for (let i = 2; i <= totalPages; i++) {
      promises.push(fetchData(url, i));
    }

    const responses = await Promise.all(promises);

    return [
      firstPage,
      ...responses.map((result) => result.data).filter((data) => data),
    ].flat();

    async function fetchData(url, pageNumber) {
      try {
        const response = await fetch(`${url}&page=${pageNumber}`);

        if (!response.ok) {
          console.error(
            `Failed to fetch page ${pageNumber}: ${response.statusText}`
          );
          return { data: [] };
        }

        return {
          totalPages: parseInt(response.headers.get("X-Pages"), 10),
          data: await response.json(),
        };
      } catch (err) {
        console.error(`Error fetching page ${pageNumber}: ${err}`);
        return { data: [] };
      }
    }
  } catch (err) {
    console.error(`Error fetching all pages: ${err}`);
    return [];
  }
}

export default fetchAllPages;
