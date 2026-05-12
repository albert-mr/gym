# { "Depends": "py-genlayer:test" }
# Minimal debug contract: render a URL via web.render and store the result in storage
# so we can inspect what GenLayer Studio's production web.render actually returned.

from genlayer import *
import genlayer.gl as gl


class ProbeRender(gl.Contract):
    last_url: str
    last_bytes: int
    last_snippet: str
    last_error: str

    def __init__(self):
        self.last_url = ""
        self.last_bytes = 0
        self.last_snippet = ""
        self.last_error = ""

    @gl.public.write
    def probe(self, url: str, mode: str = "text", wait: str = "10s") -> None:
        self.last_url = url
        self.last_error = ""

        def fetch() -> str:
            try:
                rendered = gl.nondet.web.render(url, mode=mode, wait_after_loaded=wait)
                if not isinstance(rendered, str):
                    return f"__NON_STRING__:{type(rendered).__name__}"
                return rendered
            except Exception as e:
                return f"__EXCEPTION__:{type(e).__name__}:{str(e)[:200]}"

        result = gl.eq_principle.prompt_comparative(
            fetch,
            principle="Identical text content",
        )

        if isinstance(result, str) and result.startswith("__EXCEPTION__"):
            self.last_error = result
            self.last_bytes = 0
            self.last_snippet = ""
        else:
            self.last_bytes = len(result) if isinstance(result, str) else 0
            self.last_snippet = (result[:1500] if isinstance(result, str) else "")[:1500]

    @gl.public.view
    def get_state(self) -> dict:
        return {
            "last_url": self.last_url,
            "last_bytes": self.last_bytes,
            "last_snippet": self.last_snippet,
            "last_error": self.last_error,
        }
