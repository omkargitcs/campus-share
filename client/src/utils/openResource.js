import API from "../api";

// Asks the server for a short-lived signed link (permission-checked), then opens it.
// The tab is opened synchronously first so popup blockers don't swallow it after the await.
export const openResource = async (id) => {
  const win = window.open("about:blank", "_blank");
  try {
    const { data } = await API.get(`/resources/${id}/access`);
    if (win) {
      win.opener = null;
      win.location.href = data.url;
    } else {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
    return data;
  } catch (err) {
    if (win) win.close();
    throw err;
  }
};
