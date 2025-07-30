# Solicitor Brain - AI Legal Practice Management System

A UK-law focused, on-premises AI assistant for legal practices that prioritizes compliance, security, and accuracy while automating administrative tasks.

## 🎯 Key Features

- **SRA Compliant**: Built to meet Solicitors Regulation Authority guidelines for AI use
- **Hallucination Defense**: Mandatory citation requirements with source verification
- **Per-Case Isolation**: Encrypted, isolated data storage for each case
- **UK Jurisdiction Only**: Filters and validates all legal references
- **Human-in-the-Loop**: All AI outputs require solicitor review and sign-off

## ⚡ Quick Start

### Prerequisites

- Ubuntu 24.04 LTS
- AMD GPU with ROCm 6.x support (optional but recommended)
- 32GB RAM minimum
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solicitor-brain.git
cd solicitor-brain
```

2. Run the setup script:
```bash
chmod +x scripts/*.sh
./scripts/setup_environment.sh
```

3. Configure your environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Download AI models:
```bash
./scripts/download_models.sh
```

5. Start services:
```bash
./scripts/start_services.sh
```

6. Access the application:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## 📊 Key Performance Indicators

| Metric | Target | Current |
|--------|--------|---------|
| Auto-file precision | ≥ 95% | - |
| Email→case match | ≥ 90% | - |
| Fact-check precision | ≥ 97% | - |
| Hallucination events | 0 | - |

## 🔒 Security Features

- Full-disk LUKS encryption
- Per-case AES-GCM encryption
- MFA with YubiKey support
- Immutable audit logs
- ClamAV integration for uploads
- Air-gapped quarterly archives

## 🏗️ Architecture

```
solicitor-brain/
├── backend/          # FastAPI Python backend
├── frontend/         # Next.js TypeScript frontend
├── scripts/          # Setup and maintenance scripts
├── deploy/           # Docker and deployment configs
├── docs/             # Compliance and policy documents
└── tests/            # Test suites including red-team tests
```

## 🧪 Testing

Run the test suite:
```bash
# Unit tests
pytest tests/

# Red team security tests
python scripts/red_team_test.py

# Compliance checks
./scripts/compliance_checker.sh
```

## 📋 Compliance

All screens display the mandatory banner:
> "AI outputs are organisational assistance only – verify before use."

Review compliance documents:
- [AI Usage Policy](docs/policy_ai_usage.md)
- [SRA Compliance Matrix](docs/sra_compliance_matrix.md)

## 🚨 Monitoring

Access monitoring dashboards:
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

Key alerts configured:
- High API latency (>6s)
- GPU temperature (>80°C)
- Citation rejection spikes
- Hallucination detection

## 🔧 Maintenance

### Daily Tasks
- Review Grafana dashboards
- Clear "Unreviewed" queue

### Weekly Tasks
- Update immutable logs
- Check model hash ledger

### Monthly Tasks
- Apply system updates
- Test backup restoration

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This system is designed for administrative assistance only. It does not provide legal advice. All outputs must be reviewed by qualified solicitors before use in legal matters.

## 🤝 Support

For issues or questions:
- Review [troubleshooting guide](docs/troubleshooting.md)
- Check [GitHub Issues](https://github.com/yourusername/solicitor-brain/issues)
- Contact: support@example.com

---

**Remember**: This is an AI assistant for organizational tasks only. Always verify outputs before use in legal matters.