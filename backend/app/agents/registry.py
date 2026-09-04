import importlib
import pkgutil
from pathlib import Path
from typing import Type

from app.agents.base import BaseAgent


class AgentRegistry:
    def __init__(self):
        self._agents: dict[str, BaseAgent] = {}

    def register(self, agent_class: Type[BaseAgent]) -> Type[BaseAgent]:
        instance = agent_class()
        self._agents[instance.name] = instance
        return agent_class

    def get(self, name: str) -> BaseAgent | None:
        return self._agents.get(name)

    def list_all(self) -> list[BaseAgent]:
        return list(self._agents.values())

    def discover(self):
        """自动发现并注册 agents 目录下的所有 Agent"""
        agents_dir = Path(__file__).parent
        for item in agents_dir.iterdir():
            if item.is_dir() and not item.name.startswith("_"):
                agent_file = item / "agent.py"
                if agent_file.exists():
                    try:
                        module = importlib.import_module(f"app.agents.{item.name}.agent")
                        for attr_name in dir(module):
                            attr = getattr(module, attr_name)
                            if (
                                isinstance(attr, type)
                                and issubclass(attr, BaseAgent)
                                and attr is not BaseAgent
                                and getattr(attr, "name", "")
                            ):
                                self.register(attr)
                    except Exception:
                        pass


agent_registry = AgentRegistry()


def register_agent(cls: Type[BaseAgent]) -> Type[BaseAgent]:
    """装饰器：注册 Agent 到全局注册表"""
    return agent_registry.register(cls)
