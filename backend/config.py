import secrets

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {
        "protected_namespaces": ("settings_",),
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",  # Ignore extra fields in .env
    }

    # API Settings
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    frontend_port: int = 3000
    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://127.0.0.1:3000"])

    # Security
    encryption_key: str = secrets.token_hex(32)

    # Email
    imap_server: str = ""
    imap_port: int = 993
    email_username: str = ""
    email_password: str = ""
    email_check_interval: int = 300

    # AI Models
    primary_model: str = "mixtral:8x7b-instruct-v0.1-q4_0"  # Updated to Mixtral
    specialized_model: str = "law-model:latest"
    embedding_model: str = "nomic-embed-text"  # Ollama's efficient embeddings
    ollama_host: str = "http://localhost:11434"

    # Model optimization settings
    model_quantization: str = "q4_0"  # 4-bit quantization for efficiency
    model_context_length: int = 4096  # Context window
    model_temperature: float = 0.1  # Low temperature for factual accuracy
    model_max_tokens: int = 1024  # Max response length

    # Database
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://solicitor_user:your_password@localhost:5432/solicitor_brain"
    )
    redis_url: str = "redis://localhost:6379/0"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    chroma_persist_directory: str = "./data/chromadb"

    # Jurisdiction
    jurisdiction_filter: str = "UK"
    allowed_citation_domains: list[str] = Field(
        default_factory=lambda: ["legislation.gov.uk", "bailii.org", "judiciary.uk"]
    )

    # Storage
    data_root: str = "./data"
    case_data_root: str = "./data/cases"
    upload_max_size: int = 52428800  # 50MB
    quarantine_path: str = "./quarantine"

    # Monitoring
    prometheus_port: int = 9090
    grafana_port: int = 3001
    alertmanager_port: int = 9093

    # GPU Settings
    gpu_memory_fraction: float = 0.8
    gpu_idle_fraction: float = 0.6

    # Compliance
    citation_required: bool = True
    min_citation_confidence: float = 0.95
    hallucination_check: bool = True
    audit_log_retention_days: int = 2555  # 7 years

    # Banner message
    compliance_banner: str = "AI outputs are organisational assistance only – verify before use."

    # Development
    debug: bool = True
    testing: bool = False


settings = Settings()
