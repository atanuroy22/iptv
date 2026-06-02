export default {
  async fetch() {
    return new Response(
      "This proxy has been disabled for copyright compliance.",
      { status: 410, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  },
};
