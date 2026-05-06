import json
from typing import Any


class CustomValuesMixin:
    custom_values_json: str | None

    @property
    def custom_values(self) -> dict[str, Any]:
        try:
            value = json.loads(self.custom_values_json or "{}")
        except json.JSONDecodeError:
            return {}
        return value if isinstance(value, dict) else {}

    @custom_values.setter
    def custom_values(self, value: dict[str, Any] | None) -> None:
        self.custom_values_json = json.dumps(value or {}, ensure_ascii=False)
